import { type Column, and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  creditReason,
  creditsLedger,
  jobs,
  paymentOrders,
  profiles,
  reports,
} from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";

export type LedgerFilter = { from?: Date; to?: Date; userId?: string };
type Reason = (typeof creditReason.enumValues)[number];

const unfinished = inArray(jobs.status, ["queued", "running", "paused_budget"]);

const fromReport = sql<boolean>`${creditsLedger.reportId} is not null`;

const purchaseOrder = and(
  eq(paymentOrders.id, creditsLedger.paymentOrderId),
  eq(creditsLedger.reason, "purchase"),
);

const profileCount = (userId: Column) =>
  sql<number>`(select count(*)::int from ${profiles} where ${profiles.ownerUserId} = ${userId})`;

const within = (createdAt: Column, userId: Column, filter: LedgerFilter) =>
  and(
    filter.from && gte(createdAt, filter.from),
    filter.to && lt(createdAt, filter.to),
    filter.userId === undefined ? undefined : eq(userId, filter.userId),
  );

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
  const rows = await db
    .select({
      id: reports.id,
      createdAt: reports.createdAt,
      reportError: reports.error,
      jobError: sql<string | null>`(${lastJobError})`,
      ownerUserId: profiles.ownerUserId,
    })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(eq(reports.status, "failed"))
    .orderBy(desc(reports.createdAt))
    .limit(limit);
  return Promise.all(
    rows.map(async ({ ownerUserId, ...row }) => ({
      ...row,
      reportError: (await cipherFor(ownerUserId)).decrypt(row.reportError),
    })),
  );
}

/** Lists the newest ledger rows with the given reasons, with the owner's profile count and the paid amount of a purchase. */
export async function listLedgerEvents(filter: LedgerFilter, reasons: Reason[], limit: number) {
  return db
    .select({
      id: creditsLedger.id,
      createdAt: creditsLedger.createdAt,
      userId: creditsLedger.userId,
      reason: creditsLedger.reason,
      fromReport,
      delta: creditsLedger.delta,
      amountPaise: paymentOrders.amount,
      profiles: profileCount(creditsLedger.userId),
    })
    .from(creditsLedger)
    .leftJoin(paymentOrders, purchaseOrder)
    .where(
      and(
        inArray(creditsLedger.reason, reasons),
        within(creditsLedger.createdAt, creditsLedger.userId, filter),
      ),
    )
    .orderBy(desc(creditsLedger.createdAt))
    .limit(limit);
}

/** Sums the ledger per reason, with refunds of a read apart from refunds of a purchase. */
export async function sumLedger(filter: LedgerFilter) {
  return db
    .select({
      reason: creditsLedger.reason,
      fromReport,
      events: sql<number>`count(*)::int`,
      credits: sql<number>`sum(${creditsLedger.delta})::int`,
      amountPaise: sql<number>`coalesce(sum(${paymentOrders.amount}), 0)::int`,
    })
    .from(creditsLedger)
    .leftJoin(paymentOrders, purchaseOrder)
    .where(within(creditsLedger.createdAt, creditsLedger.userId, filter))
    .groupBy(creditsLedger.reason, fromReport);
}

/**
 * Lists the newest questions that used up one question of the account.
 *
 * @remarks
 * Only ids, dates and counts leave this query. The question and answer text stay out.
 */
export async function listChargedQuestions(filter: LedgerFilter, limit: number) {
  return db
    .select({
      id: assistantQuestions.id,
      createdAt: assistantQuestions.createdAt,
      userId: assistantQuestions.userId,
      profiles: profileCount(assistantQuestions.userId),
    })
    .from(assistantQuestions)
    .where(
      and(
        eq(assistantQuestions.charged, true),
        within(assistantQuestions.createdAt, assistantQuestions.userId, filter),
      ),
    )
    .orderBy(desc(assistantQuestions.createdAt))
    .limit(limit);
}

export async function countChargedQuestions(filter: LedgerFilter) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assistantQuestions)
    .where(
      and(
        eq(assistantQuestions.charged, true),
        within(assistantQuestions.createdAt, assistantQuestions.userId, filter),
      ),
    );
  return row?.count ?? 0;
}

export async function findReportOwner(id: string) {
  const [row] = await db
    .select({ ownerUserId: profiles.ownerUserId })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(eq(reports.id, id));
  return row?.ownerUserId;
}
