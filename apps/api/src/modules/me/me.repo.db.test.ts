import { policyVersion } from "@mediwise/shared";
import { randomUUID } from "node:crypto";
import { eq, or, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  consentRecords,
  deletionLog,
  jobs,
  profiles,
  reports,
} from "../../db/schema.js";
import { giveConsents } from "../consents/index.js";
import { deleteAllByOwner, exportByOwner } from "./me.repo.js";

async function ownerWithQuestions(questions: string[]) {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "unknown" })
    .returning();
  for (const question of questions) {
    await db.insert(assistantQuestions).values({
      userId,
      profileId: profile!.id,
      question,
      answer: { sentences: [{ text: "Your first report is in MediWise.", cites: [] }] },
      refusalKind: question.includes("worry") ? "worry" : null,
    });
  }
  return userId;
}

test("the data download holds the owner's questions with their answers and no question of another user", async () => {
  const alice = await ownerWithQuestions(["What was my HbA1c?", "Should I worry?"]);
  await ownerWithQuestions(["Bob's question?"]);

  const { questions } = await exportByOwner(alice);

  expect(questions.map(({ question }) => question).toSorted()).toEqual([
    "Should I worry?",
    "What was my HbA1c?",
  ]);
  expect(questions[0]).toMatchObject({
    answer: { sentences: [{ text: "Your first report is in MediWise." }] },
    createdAt: expect.any(Date),
  });
  expect(questions.find(({ question }) => question === "Should I worry?")?.refusalKind).toBe(
    "worry",
  );
});

test("the data download leaves out cleared questions", async () => {
  const alice = await ownerWithQuestions(["Kept?", "Cleared?"]);
  await db
    .update(assistantQuestions)
    .set({ clearedAt: new Date() })
    .where(eq(assistantQuestions.question, "Cleared?"));

  const { questions } = await exportByOwner(alice);

  expect(questions.map(({ question }) => question)).toEqual(["Kept?"]);
});

test("account deletion wipes the text of every question, keeps usage, cost and charge, and the deletion log counts them", async () => {
  const userId = await ownerWithQuestions(["One?", "Two?", "Should I worry?"]);
  await db
    .update(assistantQuestions)
    .set({ charged: true, costCents: 0.17, model: "claude-haiku-5-5" })
    .where(eq(assistantQuestions.userId, userId));
  const userIdHash = `hash-${userId}`;

  await deleteAllByOwner(userId, { userIdHash, files: 0 });

  const left = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(left).toHaveLength(3);
  for (const row of left) {
    expect(row).toMatchObject({
      profileId: null,
      question: "",
      answer: { sentences: [] },
      refusalKind: null,
      charged: true,
      costCents: 0.17,
      model: "claude-haiku-5-5",
    });
    expect(row.clearedAt).not.toBeNull();
  }
  const [row] = await db.select().from(deletionLog).where(eq(deletionLog.userIdHash, userIdHash));
  expect(row?.counts).toEqual({ profiles: 1, reports: 0, files: 0, questions: 3, consents: 0 });
});

test("consent rows go out with the data download, go away with the account, and the deletion log counts them", async () => {
  const owner = randomUUID();
  await giveConsents(owner, ["terms", "health_data"], "Mozilla/5.0 Test");
  await giveConsents(owner, ["assistant_review"]);

  const { consents } = await exportByOwner(owner);
  expect(consents.map(({ kind }) => kind).toSorted()).toEqual([
    "assistant_review",
    "health_data",
    "terms",
  ]);
  expect(consents.every(({ policyVersion: version }) => version === policyVersion)).toBe(true);
  expect(consents.find(({ kind }) => kind === "terms")?.userAgentHash).toMatch(/^[0-9a-f]{64}$/);

  const userIdHash = `hash-${owner}`;
  await deleteAllByOwner(owner, { userIdHash, files: 0 });
  expect(await db.select().from(consentRecords).where(eq(consentRecords.userId, owner))).toEqual(
    [],
  );
  expect((await exportByOwner(owner)).consents).toEqual([]);
  const [row] = await db.select().from(deletionLog).where(eq(deletionLog.userIdHash, userIdHash));
  expect(row?.counts.consents).toBe(3);
});

test("account deletion leaves no jobs row for the user, in any status, and keeps the jobs of another user", async () => {
  const owner = await ownerWithQuestions([]);
  const other = randomUUID();
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.ownerUserId, owner));
  const [report] = await db
    .insert(reports)
    .values({ profileId: profile!.id, sourceKind: "pdf" })
    .returning({ id: reports.id });
  const payload = { reportId: report!.id, userId: owner };
  await db.insert(jobs).values([
    ...(["queued", "running", "paused_budget", "done", "failed"] as const).map((status) => ({
      kind: "process_report",
      userId: owner,
      payload,
      status,
      error: status === "failed" ? "Claude could not read page 2" : null,
    })),
    { kind: "process_report", payload: { reportId: report!.id } },
    { kind: "process_report", userId: other, payload: { reportId: randomUUID(), userId: other } },
  ]);

  await deleteAllByOwner(owner, { userIdHash: `hash-${owner}`, files: 0 });

  const left = await db
    .select({ userId: jobs.userId })
    .from(jobs)
    .where(
      or(
        eq(jobs.userId, owner),
        eq(jobs.userId, other),
        sql`${jobs.payload}->>'reportId' = ${report!.id}`,
      ),
    );
  expect(left).toEqual([{ userId: other }]);
});
