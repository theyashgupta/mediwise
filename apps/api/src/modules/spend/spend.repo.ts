import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { jobs, paymentOrders, profiles, reports } from "../../db/schema.js";

/**
 * Lists this month's jobs with their owner and token counts, so the service can price each one per model.
 *
 * @remarks
 * Jobs queued before MEDI-30 have no user id in the payload, so they fall back to the report's owner.
 * ponytail: one row per job priced in JS, store a cost column on jobs if a month grows past about 10,000 jobs.
 */
export async function listJobsThisMonth() {
  return db
    .select({
      userId: sql<string | null>`coalesce(${jobs.payload}->>'userId', ${profiles.ownerUserId})`,
      status: jobs.status,
      usage: jobs.usage,
      inputTokens: jobs.inputTokens,
      outputTokens: jobs.outputTokens,
    })
    .from(jobs)
    .leftJoin(reports, sql`${reports.id}::text = ${jobs.payload}->>'reportId'`)
    .leftJoin(profiles, eq(profiles.id, reports.profileId))
    .where(gte(jobs.updatedAt, sql`date_trunc('month', now())`));
}

/**
 * Counts the orders paid this month and sums their amounts in paise.
 *
 * @remarks
 * A refunded order still counts, so this is gross revenue.
 */
export async function findPurchasesThisMonth() {
  const [row] = await db
    .select({
      purchases: sql<number>`count(*)::int`,
      revenuePaise: sql<number>`coalesce(sum(${paymentOrders.amount}), 0)::int`,
    })
    .from(paymentOrders)
    .where(gte(paymentOrders.paidAt, sql`date_trunc('month', now())`));
  return { purchases: row?.purchases ?? 0, revenuePaise: row?.revenuePaise ?? 0 };
}

/** Parks a running job without counting the attempt. */
export async function parkJob(id: string) {
  await db
    .update(jobs)
    .set({
      status: "paused_budget",
      attempts: sql`greatest(${jobs.attempts} - 1, 0)`,
      updatedAt: sql`now()`,
    })
    .where(and(eq(jobs.id, id), eq(jobs.status, "running")));
}

export async function resumeParkedJobs() {
  const resumed = await db
    .update(jobs)
    .set({ status: "queued", runAfter: sql`now()`, updatedAt: sql`now()` })
    .where(eq(jobs.status, "paused_budget"))
    .returning({ id: jobs.id });
  return resumed.length;
}
