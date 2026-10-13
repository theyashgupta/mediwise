import { AppError } from "../../common/errors.js";
import { log } from "../../middleware/logger.js";
import { retryReport } from "../reports/index.js";
import { claudeCostCents, getSpendSummary, stepCostCents } from "../spend/index.js";
import * as repo from "./admin.repo.js";

const dayMs = 86_400_000;
const chartDays = 30;
const failedReportLimit = 50;
const spendAlertShare = 0.8;
const queueAlertMs = 30 * 60_000;
const alertCheckMs = 15 * 60_000;
let alertCheckedAt = 0;

const cents = (value: number) => Math.round(value * 100) / 100;

/**
 * Finds the start of the UTC day, ISO week (Monday) and month that hold `now`.
 *
 * @remarks
 * UTC matches `date_trunc` on the database, so the month here is the month the spend cap counts.
 */
export function periodStarts(now: Date) {
  const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return {
    day,
    week: day - ((now.getUTCDay() + 6) % 7) * dayMs,
    month: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  };
}

/**
 * Sorts a failed read into a fixed error class, so the page shows no raw error text.
 *
 * @remarks
 * The report error is our own sentence when the file was the problem. Otherwise the last job error tells Claude or network trouble from a bug.
 */
export function errorClass(reportError: string | null, jobError: string | null) {
  const classes: [RegExp, string][] = [
    [/damaged|not a PDF|open the photos/i, "unreadable_file"],
    [/no lab values|could not read the values/i, "no_values"],
    [/already in your reports/i, "duplicate"],
    [/larger than/i, "too_large"],
    [/date of birth/i, "missing_birth_date"],
    [/credit/i, "no_credits"],
  ];
  const known = classes.find(([pattern]) => pattern.test(reportError ?? ""));
  if (known) return known[1];
  if (/worker stopped/i.test(jobError ?? "")) return "worker_stopped";
  if (
    /overloaded|rate.?limit|timed? ?out|ECONN|fetch failed|connection|\b(429|5\d\d)\b/i.test(
      jobError ?? "",
    )
  )
    return "upstream";
  return "unexpected";
}

/** Lists the alerts that hold: spend at 80 percent of the monthly cap, or a queued job older than 30 minutes. */
export function alertsFor(monthCents: number, capCents: number, oldestQueuedMs: number | null) {
  const alerts: ("spend" | "queue")[] = [];
  if (monthCents >= capCents * spendAlertShare) alerts.push("spend");
  if (oldestQueuedMs !== null && oldestQueuedMs > queueAlertMs) alerts.push("queue");
  return alerts;
}

/**
 * Prices the jobs and questions since the earliest period on the page, and reads the queue and this month's spend summary.
 *
 * @remarks
 * The month comes from the spend summary, so the page and the alert count the same spend as the cap.
 */
async function spendAndQueue(now: Date) {
  const starts = periodStarts(now);
  const firstChartDay = starts.day - (chartDays - 1) * dayMs;
  const since = new Date(Math.min(starts.week, firstChartDay));
  const [jobs, questions, queue, summary] = await Promise.all([
    repo.listJobsSince(since),
    repo.listQuestionsSince(since),
    repo.findQueue(),
    getSpendSummary(),
  ]);
  const priced = jobs.map((job) => ({
    time: job.updatedAt.getTime(),
    done: job.status === "done",
    cents: claudeCostCents(job),
  }));
  const asked = questions.map((question) => ({
    time: question.createdAt.getTime(),
    cents: question.usage ? stepCostCents(question.usage) : 0,
  }));
  const sumSince = (start: number) =>
    cents(
      [...priced, ...asked]
        .filter((row) => row.time >= start)
        .reduce((sum, row) => sum + row.cents, 0),
    );
  const spend = {
    todayCents: sumSince(starts.day),
    weekCents: sumSince(starts.week),
    monthCents: summary.costCents,
    capCents: summary.capCents,
    hardStop: summary.hardStop,
    reads: summary.reads,
    questions: summary.questions,
    purchases: summary.purchases,
    revenuePaise: summary.revenuePaise,
  };
  const oldestQueuedMs = queue.oldestAt ? now.getTime() - queue.oldestAt.getTime() : null;
  return { spend, queue: { depth: queue.depth, oldestQueuedMs }, priced, firstChartDay };
}

/**
 * Builds the operator numbers: Claude spend against the cap, reads per day, failed reads, queue, credits and profiles.
 *
 * @remarks
 * Counts, costs, ids and dates only. Nothing here names a patient or carries health text.
 */
export async function getOverview(now = new Date()) {
  const [{ spend, queue, priced, firstChartDay }, failed, credits, people] = await Promise.all([
    spendAndQueue(now),
    repo.listFailedReports(failedReportLimit),
    repo.sumCreditsByReason(),
    repo.countProfiles(new Date(now.getTime() - chartDays * dayMs)),
  ]);
  const days = Array.from({ length: chartDays }, (_, index) => {
    const start = firstChartDay + index * dayMs;
    const jobs = priced.filter((job) => job.time >= start && job.time < start + dayMs);
    return {
      date: new Date(start).toISOString().slice(0, 10),
      reads: jobs.filter((job) => job.done).length,
      costCents: cents(jobs.reduce((sum, job) => sum + job.cents, 0)),
    };
  });
  const reads = days.reduce((sum, day) => sum + day.reads, 0);
  const cost = days.reduce((sum, day) => sum + day.costCents, 0);
  const ledger = Object.fromEntries(credits.map((row) => [row.reason, row.total]));
  return {
    spend,
    days,
    meanCostPerReadCents: reads > 0 ? cents(cost / reads) : null,
    failed: failed.map((report) => ({
      id: report.id,
      createdAt: report.createdAt.toISOString(),
      errorClass: errorClass(report.reportError, report.jobError),
    })),
    queue,
    credits: {
      granted: ledger.grant ?? 0,
      purchased: ledger.purchase ?? 0,
      spentOnReads: -((ledger.upload ?? 0) + (ledger.refund ?? 0)),
      spentOnQuestions: -(ledger.questions ?? 0),
    },
    people,
    alerts: alertsFor(spend.monthCents, spend.capCents, queue.oldestQueuedMs),
  };
}

/**
 * Writes one structured warning per alert that holds, at most every 15 minutes.
 *
 * @remarks
 * The worker calls this on every poll, so an alert reaches the log when nobody opens the admin page. No email until SMTP lands.
 */
export async function logAlerts(now = new Date()) {
  if (now.getTime() - alertCheckedAt < alertCheckMs) return;
  alertCheckedAt = now.getTime();
  const { spend, queue } = await spendAndQueue(now);
  const alerts = alertsFor(spend.monthCents, spend.capCents, queue.oldestQueuedMs);
  if (alerts.includes("spend"))
    log.warn(
      `alert kind=spend month_cents=${spend.monthCents} cap_cents=${spend.capCents} share=${(spend.monthCents / spend.capCents).toFixed(2)}`,
    );
  if (alerts.includes("queue"))
    log.warn(
      `alert kind=queue depth=${queue.depth} oldest_minutes=${Math.floor((queue.oldestQueuedMs ?? 0) / 60_000)}`,
    );
}

/** Reads a failed report again for its owner, the same as the owner's retry button. */
export async function retryFailedReport(id: string) {
  const owner = await repo.findReportOwner(id);
  if (!owner) throw new AppError(404, "We could not find this report");
  await retryReport(owner, id);
}
