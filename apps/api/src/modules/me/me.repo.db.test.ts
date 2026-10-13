import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { assistantQuestions, deletionLog, profiles } from "../../db/schema.js";
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

test("account deletion removes the questions and the deletion log counts them", async () => {
  const userId = await ownerWithQuestions(["One?", "Two?", "Three?"]);
  const userIdHash = `hash-${userId}`;

  await deleteAllByOwner(userId, { userIdHash, files: 0 });

  const left = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(left).toHaveLength(0);
  const [row] = await db.select().from(deletionLog).where(eq(deletionLog.userIdHash, userIdHash));
  expect(row?.counts).toEqual({ profiles: 1, reports: 0, files: 0, questions: 3 });
});
