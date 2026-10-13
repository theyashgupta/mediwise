import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { assistantQuestions, creditsLedger, jobs, profiles, reports } from "../../db/schema.js";

const unfinished = inArray(jobs.status, ["queued", "running", "paused_budget"]);

/** Lists the jobs updated since `since` with their token counts, so the service can price each one per model. */
export async function listJobsSince(since: Date) {
  return db
    .select({
      status: jobs.status,
      usage: jobs.usage,
      inputTokens: jobs.inputTokens,
      outputTokens: jobs.outputTokens,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .where(gte(jobs.updatedAt, since));
}

/** Lists the assistant questions asked since `since` with their token usage, cleared ones included. */
export async function listQuestionsSince(since: Date) {
  return db
    .select({ usage: assistantQuestions.usage, createdAt: assistantQuestions.createdAt })
    .from(assistantQuestions)
    .where(gte(assistantQuestions.createdAt, since));
}

/**
 * Counts the jobs that have not finished and finds when the oldest one was queued.
 *
 * @remarks
 * A job parked by the spend cap still waits for a read, so it counts as queued.
 */
export async function findQueue() {
  const [row] = await db
    .select({
      depth: sql<number>`count(*)::int`,
      oldestAt: sql<string | null>`min(${jobs.createdAt})`,
    })
    .from(jobs)
    .where(unfinished);
  return { depth: row?.depth ?? 0, oldestAt: row?.oldestAt ? new Date(row.oldestAt) : null };
}

/**
 * Lists the newest failed reports with the stored report error and the error of their last failed job.
 *
 * @remarks
 * Only ids, dates and error text leave this query. The title, lab and profile name stay out, so the admin page names no patient.
 */
export async function listFailedReports(limit: number) {
  const lastJobError = db
    .select({ error: jobs.error })
    .from(jobs)
    .where(and(sql`${jobs.payload}->>'reportId' = ${reports.id}::text`, eq(jobs.status, "failed")))
    .orderBy(desc(jobs.updatedAt))
    .limit(1);
  return db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      reportError: reports.error,
      jobError: sql<string | null>`(${lastJobError})`,
    })
    .from(reports)
    .where(eq(reports.status, "failed"))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
}

/** Sums the credits ledger per reason over every user. */
export async function sumCreditsByReason() {
  return db
    .select({ reason: creditsLedger.reason, total: sql<number>`sum(${creditsLedger.delta})::int` })
    .from(creditsLedger)
    .groupBy(creditsLedger.reason);
}

/**
 * Counts the profiles and their owners, in total and with a report added since `since`.
 *
 * @remarks
 * A draft is an upload the user never finished, so it does not make a profile active.
 */
export async function countProfiles(since: Date) {
  const active = db
    .selectDistinct({ id: reports.profileId })
    .from(reports)
    .where(and(gte(reports.createdAt, since), ne(reports.status, "draft")));
  const [row] = await db
    .select({
      profiles: sql<number>`count(*)::int`,
      users: sql<number>`count(distinct ${profiles.ownerUserId})::int`,
      activeProfiles: sql<number>`count(*) filter (where ${inArray(profiles.id, active)})::int`,
      activeUsers: sql<number>`count(distinct ${profiles.ownerUserId}) filter (where ${inArray(profiles.id, active)})::int`,
    })
    .from(profiles);
  return {
    profiles: row?.profiles ?? 0,
    users: row?.users ?? 0,
    activeProfiles: row?.activeProfiles ?? 0,
    activeUsers: row?.activeUsers ?? 0,
  };
}

export async function findReportOwner(id: string) {
  const [row] = await db
    .select({ ownerUserId: profiles.ownerUserId })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(eq(reports.id, id));
  return row?.ownerUserId;
}
