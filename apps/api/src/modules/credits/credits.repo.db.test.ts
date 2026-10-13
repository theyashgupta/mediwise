import { asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { creditsLedger, profiles, reports } from "../../db/schema.js";
import { insertGrant } from "./credits.repo.js";
import { chargeReport, getCreditBalance } from "./credits.service.js";

async function newReport(userId: string) {
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "south_asian" })
    .returning({ id: profiles.id });
  const [report] = await db
    .insert(reports)
    .values({ profileId: profile!.id, sourceKind: "pdf" })
    .returning({ id: reports.id });
  return report!.id;
}

async function ledgerOf(userId: string) {
  return db
    .select({
      delta: creditsLedger.delta,
      reason: creditsLedger.reason,
      reportId: creditsLedger.reportId,
    })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId))
    .orderBy(asc(creditsLedger.delta));
}

test("a grant and a spend update the balance and the ledger rows", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 2, "test grant");
  const reportId = await newReport(userId);

  await chargeReport(reportId);
  await chargeReport(reportId);

  expect(await getCreditBalance(userId)).toBe(1);
  expect(await ledgerOf(userId)).toEqual([
    { delta: -1, reason: "upload", reportId },
    { delta: 2, reason: "grant", reportId: null },
  ]);
});

test("a spend past zero is refused and writes no ledger row", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  const first = await newReport(userId);
  const second = await newReport(userId);
  await chargeReport(first);

  await expect(chargeReport(second)).rejects.toMatchObject({ status: 402 });

  expect(await getCreditBalance(userId)).toBe(0);
  expect((await ledgerOf(userId)).map((row) => row.reportId)).not.toContain(second);
});

test("two parallel spends of the last credit debit it once", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  const reportIds = await Promise.all([newReport(userId), newReport(userId)]);

  const results = await Promise.allSettled(reportIds.map((id) => chargeReport(id)));

  expect(results.map((result) => result.status).toSorted()).toEqual(["fulfilled", "rejected"]);
  expect(await getCreditBalance(userId)).toBe(0);
});
