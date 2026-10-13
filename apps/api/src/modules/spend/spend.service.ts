import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { claudeCostCents } from "./claude-cost.js";
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

/**
 * Tells whether this month's Claude spend reached `CLAUDE_MONTHLY_CAP_CENTS`.
 *
 * @remarks
 * Logs one warning per hour while over the cap, so a paused worker does not flood the log every poll.
 */
export async function isOverBudget() {
  const spentCents = (await monthJobs()).reduce((sum, job) => sum + job.cents, 0);
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
  const [month, payments] = await Promise.all([monthJobs(), repo.findPurchasesThisMonth()]);
  const byUser = new Map<string | null, { costCents: number; reads: number }>();
  for (const job of month) {
    const user = byUser.get(job.userId) ?? { costCents: 0, reads: 0 };
    byUser.set(job.userId, {
      costCents: user.costCents + job.cents,
      reads: user.reads + Number(job.done),
    });
  }
  const cents = (value: number) => Math.round(value * 100) / 100;
  return {
    month: new Date().toISOString().slice(0, 7),
    costCents: cents(month.reduce((sum, job) => sum + job.cents, 0)),
    capCents: env.CLAUDE_MONTHLY_CAP_CENTS,
    hardStop: env.CLAUDE_HARD_STOP,
    reads: month.filter((job) => job.done).length,
    ...payments,
    topUsers: [...byUser]
      .map(([userId, user]) => ({ userId, costCents: cents(user.costCents), reads: user.reads }))
      .toSorted((a, b) => b.costCents - a.costCents)
      .slice(0, topUserCount),
  };
}
