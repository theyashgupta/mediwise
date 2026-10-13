import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { claudeCostCents, stepCostCents } from "./claude-cost.js";
import * as repo from "./spend.repo.js";

const warnEveryMs = 60 * 60 * 1000;
const topUserCount = 10;
let warnedAt = 0;

async function monthJobs() {
  return (await repo.listJobsThisMonth()).map((job) => ({
    userId: job.userId,
    done: job.status === "done",
    cents: claudeCostCents(job),
  }));
}

async function monthQuestions() {
  return (await repo.listQuestionsThisMonth()).map(({ userId, usage }) => ({
    userId,
    cents: usage ? stepCostCents(usage) : 0,
  }));
}

const sumCents = (rows: { cents: number }[]) => rows.reduce((sum, row) => sum + row.cents, 0);

/**
 * Tells whether this month's Claude spend reached `CLAUDE_MONTHLY_CAP_CENTS`.
 *
 * @remarks
 * Logs one warning per hour while over the cap, so a paused worker does not flood the log every poll.
 */
export async function isOverBudget() {
  const [month, questions] = await Promise.all([monthJobs(), monthQuestions()]);
  const spentCents = sumCents(month) + sumCents(questions);
  const over = spentCents >= env.CLAUDE_MONTHLY_CAP_CENTS;
  if (over && Date.now() - warnedAt >= warnEveryMs) {
    warnedAt = Date.now();
    log.warn(
      `spend over cap spent_cents=${spentCents.toFixed(2)} cap_cents=${env.CLAUDE_MONTHLY_CAP_CENTS}, reading is paused`,
    );
  }
  return over;
}

export async function parkJob(id: string) {
  await repo.parkJob(id);
}

export async function resumeParkedJobs() {
  const count = await repo.resumeParkedJobs();
  if (count > 0) log.info(`spend under cap, resumed jobs=${count}`);
}

export async function getSpendSummary() {
  const [month, questions, payments] = await Promise.all([
    monthJobs(),
    monthQuestions(),
    repo.findPurchasesThisMonth(),
  ]);
  const byUser = new Map<string | null, { costCents: number; reads: number; questions: number }>();
  const userOf = (userId: string | null) =>
    byUser.get(userId) ?? { costCents: 0, reads: 0, questions: 0 };
  for (const job of month) {
    const user = userOf(job.userId);
    byUser.set(job.userId, {
      ...user,
      costCents: user.costCents + job.cents,
      reads: user.reads + Number(job.done),
    });
  }
  for (const question of questions) {
    const user = userOf(question.userId);
    byUser.set(question.userId, {
      ...user,
      costCents: user.costCents + question.cents,
      questions: user.questions + 1,
    });
  }
  const cents = (value: number) => Math.round(value * 100) / 100;
  return {
    month: new Date().toISOString().slice(0, 7),
    costCents: cents(sumCents(month) + sumCents(questions)),
    capCents: env.CLAUDE_MONTHLY_CAP_CENTS,
    hardStop: env.CLAUDE_HARD_STOP,
    reads: month.filter((job) => job.done).length,
    questions: questions.length,
    ...payments,
    topUsers: [...byUser]
      .map(([userId, user]) => ({ userId, ...user, costCents: cents(user.costCents) }))
      .toSorted((a, b) => b.costCents - a.costCents)
      .slice(0, topUserCount),
  };
}
