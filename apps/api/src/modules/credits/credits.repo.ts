import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { creditsLedger, profiles, reports } from "../../db/schema.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const balance = sql<number>`coalesce(sum(${creditsLedger.delta}), 0)::int`;

/**
 * Holds a lock on one user's credits until the transaction ends.
 *
 * @remarks
 * Two parallel uploads would otherwise both read a balance of 1 and both pass.
 */
export async function lockUserCredits(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

export async function findBalance(userId: string) {
  const [row] = await db
    .select({ balance })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId));
  return row?.balance ?? 0;
}

/**
 * Returns the balance, the debits of the last 24 hours, and the reports that wait for their debit.
 *
 * @remarks
 * A report is debited only when its job starts, so drafts, queued and paused reports still hold a claim on the balance.
 */
export async function findCreditUsage(tx: Tx, userId: string) {
  const [ledger] = await tx
    .select({
      balance,
      readsToday: sql<number>`(count(*) filter (where ${creditsLedger.reason} = 'upload' and ${creditsLedger.createdAt} > now() - interval '1 day'))::int`,
    })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId));
  const [waiting] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(
      and(eq(profiles.ownerUserId, userId), inArray(reports.status, ["draft", "queued", "paused"])),
    );
  return {
    balance: ledger?.balance ?? 0,
    readsToday: ledger?.readsToday ?? 0,
    waiting: waiting?.count ?? 0,
  };
}

/**
 * Debits one credit for a report, and returns false when the owner has none.
 *
 * @remarks
 * A report that already holds a debit is not debited again, so a retried or resumed job costs one credit.
 */
export async function debitReportCredit(reportId: string) {
  return db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ userId: profiles.ownerUserId })
      .from(reports)
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(eq(reports.id, reportId));
    if (!owner) return false;
    await lockUserCredits(tx, owner.userId);
    const [row] = await tx
      .select({
        balance,
        held: sql<number>`coalesce(sum(${creditsLedger.delta}) filter (where ${creditsLedger.reportId} = ${reportId}), 0)::int`,
      })
      .from(creditsLedger)
      .where(eq(creditsLedger.userId, owner.userId));
    if ((row?.held ?? 0) < 0) return true;
    if ((row?.balance ?? 0) < 1) return false;
    await tx
      .insert(creditsLedger)
      .values({ userId: owner.userId, delta: -1, reason: "upload", reportId });
    return true;
  });
}

/**
 * Gives back the credit a report holds, if it holds one.
 *
 * @remarks
 * The owner comes from the debit row, so this works after the report row is gone.
 */
export async function refundReportCredit(reportId: string) {
  await db.transaction(async (tx) => {
    const [debit] = await tx
      .select({ userId: creditsLedger.userId })
      .from(creditsLedger)
      .where(eq(creditsLedger.reportId, reportId))
      .limit(1);
    if (!debit) return;
    await lockUserCredits(tx, debit.userId);
    const [row] = await tx
      .select({ held: balance })
      .from(creditsLedger)
      .where(eq(creditsLedger.reportId, reportId));
    if ((row?.held ?? 0) >= 0) return;
    await tx
      .insert(creditsLedger)
      .values({ userId: debit.userId, delta: 1, reason: "refund", reportId });
  });
}

export async function insertGrant(userId: string, delta: number, note: string) {
  await db.insert(creditsLedger).values({ userId, delta, reason: "grant", note });
}
