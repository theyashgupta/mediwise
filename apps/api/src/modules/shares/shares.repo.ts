import { and, count, desc, eq, gt, isNull, max, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { reportShareOpens, reportShares } from "../../db/schema.js";

const isOpen = and(isNull(reportShares.endedAt), gt(reportShares.expiresAt, sql`now()`));

export async function insertShare(share: typeof reportShares.$inferInsert) {
  const [row] = await db
    .insert(reportShares)
    .values(share)
    .returning({ id: reportShares.id, expiresAt: reportShares.expiresAt });
  if (!row) throw new Error("insert into report_shares returned no row");
  return row;
}

export async function listOpenShares(ownerUserId: string, reportId: string) {
  return db
    .select({
      id: reportShares.id,
      createdAt: reportShares.createdAt,
      expiresAt: reportShares.expiresAt,
      openCount: count(reportShareOpens.id),
      lastOpenedAt: max(reportShareOpens.openedAt),
    })
    .from(reportShares)
    .leftJoin(reportShareOpens, eq(reportShareOpens.shareId, reportShares.id))
    .where(
      and(eq(reportShares.ownerUserId, ownerUserId), eq(reportShares.reportId, reportId), isOpen),
    )
    .groupBy(reportShares.id)
    .orderBy(desc(reportShares.createdAt));
}

export async function endShare(ownerUserId: string, reportId: string, id: string) {
  const rows = await db
    .update(reportShares)
    .set({ endedAt: sql`now()` })
    .where(
      and(
        eq(reportShares.id, id),
        eq(reportShares.reportId, reportId),
        eq(reportShares.ownerUserId, ownerUserId),
        isNull(reportShares.endedAt),
      ),
    )
    .returning({ id: reportShares.id });
  return rows.length > 0;
}

export async function findOpenShare(tokenHash: string) {
  const [row] = await db
    .select({
      id: reportShares.id,
      reportId: reportShares.reportId,
      ownerUserId: reportShares.ownerUserId,
      expiresAt: reportShares.expiresAt,
    })
    .from(reportShares)
    .where(and(eq(reportShares.tokenHash, tokenHash), isOpen));
  return row;
}

export async function insertShareOpen(shareId: string) {
  await db.insert(reportShareOpens).values({ shareId });
}
