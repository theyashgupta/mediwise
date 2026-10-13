import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { assistantQuestions, creditsLedger, profiles, reports } from "../../db/schema.js";

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
export async function findCreditUsage(userId: string, tx: Tx | typeof db = db) {
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

/**
 * Counts what questions left is made of: reads not refunded, question packs, and charged questions.
 *
 * @remarks
 * Reads come from the ledger, not from `reports`, so a deleted report keeps its free questions. A purchase refund has
 * no report id, so it never takes back free questions.
 */
export async function findQuestionCounts(userId: string, executor: Tx | typeof db = db) {
  const [ledger] = await executor
    .select({
      reads: sql<number>`(count(*) filter (where ${creditsLedger.reason} = 'upload') - count(*) filter (where ${creditsLedger.reason} = 'refund' and ${creditsLedger.reportId} is not null))::int`,
      packs: sql<number>`(count(*) filter (where ${creditsLedger.reason} = 'questions'))::int`,
    })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId));
  const [questions] = await executor
    .select({ charged: sql<number>`count(*)::int` })
    .from(assistantQuestions)
    .where(and(eq(assistantQuestions.userId, userId), eq(assistantQuestions.charged, true)));
  return {
    reads: ledger?.reads ?? 0,
    packs: ledger?.packs ?? 0,
    charged: questions?.charged ?? 0,
  };
}

export type CreditUsage = Awaited<ReturnType<typeof findCreditUsage>>;
export type QuestionCounts = Awaited<ReturnType<typeof findQuestionCounts>>;

/** Debits 1 credit for a pack of questions under the credit lock, and returns the new balance, or undefined when `canDebit` refuses. */
export async function debitQuestionPack(
  userId: string,
  note: string,
  canDebit: (usage: CreditUsage) => boolean,
) {
  return db.transaction(async (tx) => {
    await lockUserCredits(tx, userId);
    const usage = await findCreditUsage(userId, tx);
    if (!canDebit(usage)) return undefined;
    await tx.insert(creditsLedger).values({ userId, delta: -1, reason: "questions", note });
    return usage.balance - 1;
  });
}

export async function insertGrant(userId: string, delta: number, note: string) {
  await db.insert(creditsLedger).values({ userId, delta, reason: "grant", note });
}
