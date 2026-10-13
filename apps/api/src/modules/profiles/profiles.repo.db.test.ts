import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { assistantQuestions, profiles } from "../../db/schema.js";
import { deleteProfile } from "./profiles.repo.js";

test("a deleted profile wipes the text of its questions and keeps the rows with usage and charge", async () => {
  const userId = randomUUID();
  const [profile, other] = await db
    .insert(profiles)
    .values([
      { ownerUserId: userId, name: "Gone", relation: "parent", ancestry: "unknown" },
      { ownerUserId: userId, name: "Kept", relation: "self", ancestry: "unknown" },
    ])
    .returning({ id: profiles.id });
  await db.insert(assistantQuestions).values([
    {
      userId,
      profileId: profile!.id,
      question: "Should I worry?",
      answer: { sentences: [{ text: "Your HbA1c was 5.9 %.", cites: [] }] },
      refusalKind: "worry",
      model: "claude-haiku-5-5",
      costCents: 0.17,
      charged: true,
    },
    { userId, profileId: other!.id, question: "Other profile?", answer: { sentences: [] } },
  ]);

  await deleteProfile(userId, profile!.id);

  const rows = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(rows).toHaveLength(2);
  const wiped = rows.find(({ profileId }) => profileId === null);
  expect(wiped).toMatchObject({
    question: "",
    answer: { sentences: [] },
    refusalKind: null,
    model: "claude-haiku-5-5",
    costCents: 0.17,
    charged: true,
  });
  expect(wiped!.clearedAt).not.toBeNull();
  expect(rows.find(({ profileId }) => profileId === other!.id)).toMatchObject({
    question: "Other profile?",
    clearedAt: null,
  });
});

test("another owner cannot delete the profile or wipe its questions", async () => {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Mine", relation: "self", ancestry: "unknown" })
    .returning({ id: profiles.id });
  await db
    .insert(assistantQuestions)
    .values({ userId, profileId: profile!.id, question: "Mine?", answer: { sentences: [] } });

  await deleteProfile(randomUUID(), profile!.id);

  const [row] = await db
    .select({ question: assistantQuestions.question })
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(row).toEqual({ question: "Mine?" });
});

test("a question stored while the profile delete waits is wiped too", async () => {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Gone", relation: "self", ancestry: "unknown" })
    .returning({ id: profiles.id });
  let deleting: Promise<void> | undefined;
  await db.transaction(async (tx) => {
    await tx.insert(assistantQuestions).values({
      userId,
      profileId: profile!.id,
      question: "In flight?",
      answer: { sentences: [] },
    });
    deleting = deleteProfile(userId, profile!.id);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  await deleting;

  const [row] = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(row).toMatchObject({ profileId: null, question: "" });
  expect(row!.clearedAt).not.toBeNull();
});
