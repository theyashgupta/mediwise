import { AppError } from "../../common/errors.js";
import { log } from "../../middleware/logger.js";
import { retryReport } from "../reports/index.js";
import { getSpendSummary } from "../spend/index.js";
import * as repo from "./admin.repo.js";
import type { CreditsQuery } from "./admin.schemas.js";

const dayMs = 86_400_000;
const eventLimit = 200;
const failedReportLimit = 50;
const spendAlertShare = 0.8;
const queueAlertMs = 30 * 60_000;
const alertCheckMs = 15 * 60_000;
let alertCheckedAt = 0;

const reportCreditKinds = ["grant", "purchase", "upload", "refund", "purchase_refund"] as const;
const questionPackKinds = ["questions", "question"] as const;
type CreditKind = (typeof reportCreditKinds)[number] | (typeof questionPackKinds)[number];

/**
 * Names the kind of a ledger row.
 *
 * @remarks
 * A refund with a report gives back the credit of a failed read. A refund without one takes back the credits of a refunded payment.
 */
export function kindOf(row: { reason: string; fromReport: boolean }): CreditKind {
  if (row.reason === "refund" && !row.fromReport) return "purchase_refund";
  return row.reason as CreditKind;
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

/** Turns the UTC days of the query into a half-open time range, so `to` includes its whole day. */
export function ledgerFilter(query: CreditsQuery): repo.LedgerFilter {
  return {
    from: query.from ? new Date(`${query.from}T00:00:00Z`) : undefined,
    to: query.to ? new Date(Date.parse(`${query.to}T00:00:00Z`) + dayMs) : undefined,
    userId: query.userId,
  };
}

/**
 * Builds the credit history: totals per kind and the newest events, for report credits and for question packs apart.
 *
 * @remarks
 * User ids, counts, credits, paise and dates only. Nothing here names a patient or carries health text.
 */
export async function getCreditHistory(query: CreditsQuery) {
  const filter = ledgerFilter(query);
  const [ledger, packs, questions, sums, questionsUsed] = await Promise.all([
    repo.listLedgerEvents(filter, ["grant", "purchase", "upload", "refund"], eventLimit),
    repo.listLedgerEvents(filter, ["questions"], eventLimit),
    repo.listChargedQuestions(filter, eventLimit),
    repo.sumLedger(filter),
    repo.countChargedQuestions(filter),
  ]);
  const totals = (kinds: readonly CreditKind[]) =>
    kinds.map((kind) => {
      const rows = sums.filter((row) => kindOf(row) === kind);
      return {
        kind,
        events: kind === "question" ? questionsUsed : rows.reduce((sum, r) => sum + r.events, 0),
        credits: rows.reduce((sum, r) => sum + r.credits, 0),
        amountPaise: rows.reduce((sum, r) => sum + r.amountPaise, 0),
      };
    });
  const event = (row: (typeof ledger)[number]) => ({
    id: row.id,
    at: row.createdAt.toISOString(),
    userId: row.userId,
    profiles: row.profiles,
    kind: kindOf(row),
    credits: row.delta as number | null,
    amountPaise: row.amountPaise,
  });
  const questionEvents = questions.map((row) => ({
    id: row.id,
    at: row.createdAt.toISOString(),
    userId: row.userId,
    profiles: row.profiles,
    kind: "question" as CreditKind,
    credits: null,
    amountPaise: null,
  }));
  return {
    reportCredits: { totals: totals(reportCreditKinds), events: ledger.map(event) },
    questionPacks: {
      totals: totals(questionPackKinds),
      events: [...packs.map(event), ...questionEvents]
        .toSorted((a, b) => b.at.localeCompare(a.at))
        .slice(0, eventLimit),
    },
    eventLimit,
  };
}

export async function listFailedReads() {
  const failed = await repo.listFailedReports(failedReportLimit);
  return failed.map((report) => ({
    id: report.id,
    createdAt: report.createdAt.toISOString(),
    errorClass: errorClass(report.reportError, report.jobError),
  }));
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
  const [queue, spend] = await Promise.all([repo.findQueue(), getSpendSummary()]);
  const oldestQueuedMs = queue.oldestAt ? now.getTime() - queue.oldestAt.getTime() : null;
  const alerts = alertsFor(spend.costCents, spend.capCents, oldestQueuedMs);
  if (alerts.includes("spend"))
    log.warn(
      `alert kind=spend month_cents=${spend.costCents} cap_cents=${spend.capCents} share=${(spend.costCents / spend.capCents).toFixed(2)}`,
    );
  if (alerts.includes("queue"))
    log.warn(
      `alert kind=queue depth=${queue.depth} oldest_minutes=${Math.floor((oldestQueuedMs ?? 0) / 60_000)}`,
    );
}

/** Reads a failed report again for its owner, the same as the owner's retry button. */
export async function retryFailedReport(id: string) {
  const owner = await repo.findReportOwner(id);
  if (!owner) throw new AppError(404, "We could not find this report");
  await retryReport(owner, id);
}
