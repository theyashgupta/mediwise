import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { assistantQuestions, creditsLedger, profiles, reports } from "../../db/schema.js";
import { insertGrant } from "./credits.repo.js";
import {
  chargeReport,
  getCreditBalance,
  getQuestionsLeft,
  refundReport,
  takeQuestionPack,
} from "./credits.service.js";

async function newReport(userId: string, status: "done" | "queued" = "done") {
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "south_asian" })
    .returning({ id: profiles.id });
  const [report] = await db
    .insert(reports)
    .values({ profileId: profile!.id, sourceKind: "pdf", status })
    .returning({ id: reports.id });
  return report!.id;
}

async function chargedQuestions(userId: string, count: number) {
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "south_asian" })
    .returning({ id: profiles.id });
  await db.insert(assistantQuestions).values(
    Array.from({ length: count }, () => ({
      userId,
      profileId: profile!.id,
      question: "What was my HbA1c?",
      answer: { sentences: [] },
      charged: true,
    })),
  );
}

async function packRows(userId: string) {
  return db
    .select({ delta: creditsLedger.delta, note: creditsLedger.note })
    .from(creditsLedger)
    .where(and(eq(creditsLedger.userId, userId), eq(creditsLedger.reason, "questions")));
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

test("two parallel question packs with a balance of 1 debit one credit", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  const results = await Promise.allSettled([takeQuestionPack(userId), takeQuestionPack(userId)]);
  expect(results.map((result) => result.status).toSorted()).toEqual(["fulfilled", "rejected"]);
  expect(results.find((result) => result.status === "rejected")).toMatchObject({
    reason: { status: 402 },
  });
  expect(await packRows(userId)).toEqual([{ delta: -1, note: "20 questions" }]);
  expect(await getCreditBalance(userId)).toBe(0);
  expect(await getQuestionsLeft(userId)).toBe(20);
});

test("a queued report keeps its credit when the user takes a question pack", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  await newReport(userId, "queued");
  await expect(takeQuestionPack(userId)).rejects.toMatchObject({ status: 402 });
  expect(await packRows(userId)).toEqual([]);
  expect(await getCreditBalance(userId)).toBe(1);
});

test("a deleted report keeps its 5 free questions", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  const reportId = await newReport(userId);
  await chargeReport(reportId);
  expect(await getQuestionsLeft(userId)).toBe(5);
  await db.delete(reports).where(eq(reports.id, reportId));
  expect(await getQuestionsLeft(userId)).toBe(5);
});

test("a read refunded after its questions were used leaves questions left at 0, never below", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 1, "test grant");
  const reportId = await newReport(userId);
  await chargeReport(reportId);
  await chargedQuestions(userId, 5);
  await refundReport(reportId);
  expect(await getQuestionsLeft(userId)).toBe(0);
});

test("questions left is 5 per read not refunded, plus 20 per pack, minus the charged questions", async () => {
  const userId = randomUUID();
  await insertGrant(userId, 5, "test grant");
  const [first, second] = await Promise.all([newReport(userId), newReport(userId)]);
  await chargeReport(first!);
  await chargeReport(second!);
  await refundReport(second!);
  await takeQuestionPack(userId);
  await chargedQuestions(userId, 3);
  await chargedQuestions(randomUUID(), 4);
  await db
    .insert(creditsLedger)
    .values({ userId, delta: 1, reason: "refund", note: "order refund" });
  expect(await getQuestionsLeft(userId)).toBe(5 * 1 + 20 - 3);
});
