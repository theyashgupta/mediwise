import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { assistantConsents, assistantQuestions, deletionLog, profiles } from "../../db/schema.js";
import { giveReviewConsent } from "../assistant/index.js";
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
  expect(row?.counts).toEqual({ profiles: 1, reports: 0, files: 0, questions: 3 });
});

test("review consent keeps its first time, goes out with the data download and goes away with the account", async () => {
  const owner = randomUUID();
  await giveReviewConsent(owner);
  const [first] = await db
    .select({ agreedAt: assistantConsents.agreedAt })
    .from(assistantConsents)
    .where(eq(assistantConsents.userId, owner));
  await giveReviewConsent(owner);
  expect((await exportByOwner(owner)).assistantConsent).toEqual({ agreedAt: first!.agreedAt });

  await deleteAllByOwner(owner, { userIdHash: "hash", files: 0 });
  expect(
    await db.select().from(assistantConsents).where(eq(assistantConsents.userId, owner)),
  ).toEqual([]);
  expect((await exportByOwner(owner)).assistantConsent).toBeNull();
});
