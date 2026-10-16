import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { assistantQuestions, profiles } from "../../db/schema.js";
import { cipherFor } from "../../lib/user-keys.js";
import {
  deleteProfile,
  findProfileById,
  insertProfile,
  insertSelfProfileIfMissing,
  listProfilesByOwner,
  updateProfile,
} from "./profiles.repo.js";

const rawProfile = async (id: string) =>
  (
    await db
      .select({ name: profiles.name, dateOfBirth: profiles.dateOfBirth })
      .from(profiles)
      .where(eq(profiles.id, id))
  )[0]!;

test("a raw SELECT of profiles.name returns a v1: string, and the repo returns the name typed", async () => {
  const userId = randomUUID();
  const created = await insertProfile(userId, {
    name: "Asha Rao",
    relation: "self",
    dateOfBirth: "1984-03-02",
    ancestry: "south_asian",
  });

  expect(created).toMatchObject({ name: "Asha Rao", dateOfBirth: "1984-03-02" });
  const raw = await rawProfile(created!.id);
  expect(raw.name).toMatch(/^v1:/);
  expect(raw.dateOfBirth).toMatch(/^v1:/);
  expect(raw.name).not.toContain("Asha");
  expect(await findProfileById(userId, created!.id)).toMatchObject({
    name: "Asha Rao",
    dateOfBirth: "1984-03-02",
  });
});

test("an update and the self profile write ciphertext, and the list reads plaintext", async () => {
  const userId = randomUUID();
  await insertSelfProfileIfMissing(userId, "asha");
  const [self] = await listProfilesByOwner(userId);
  expect(self?.name).toBe("asha");
  expect((await rawProfile(self!.id)).name).toMatch(/^v1:/);

  const updated = await updateProfile(userId, self!.id, { name: "Asha Rao", dateOfBirth: null });
  expect(updated).toMatchObject({ name: "Asha Rao", dateOfBirth: null });
  expect(await rawProfile(self!.id)).toMatchObject({
    name: expect.stringMatching(/^v1:/),
    dateOfBirth: null,
  });
});

test("a profile written before encryption still reads as it was stored", async () => {
  const userId = randomUUID();
  const [legacy] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Legacy Name", relation: "self", ancestry: "unknown" })
    .returning({ id: profiles.id });

  expect((await findProfileById(userId, legacy!.id))?.name).toBe("Legacy Name");
});

test("a profile name encrypted for another user fails closed instead of showing ciphertext", async () => {
  const userId = randomUUID();
  const foreign = (await cipherFor(randomUUID())).encrypt("Not yours");
  const [row] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: foreign, relation: "self", ancestry: "unknown" })
    .returning({ id: profiles.id });

  await expect(findProfileById(userId, row!.id)).rejects.toThrow("another data key");
});

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
      answer: JSON.stringify({ sentences: [{ text: "Your HbA1c was 5.9 %.", cites: [] }] }),
      refusalKind: "worry",
      model: "claude-haiku-5-5",
      costCents: 0.17,
      charged: true,
    },
    {
      userId,
      profileId: other!.id,
      question: "Other profile?",
      answer: JSON.stringify({ sentences: [] }),
    },
  ]);

  await deleteProfile(userId, profile!.id);

  const rows = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(rows).toHaveLength(2);
  const wiped = rows.find(({ profileId }) => profileId === null);
  expect(wiped).toMatchObject({
    question: null,
    answer: null,
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
  await db.insert(assistantQuestions).values({
    userId,
    profileId: profile!.id,
    question: "Mine?",
    answer: JSON.stringify({ sentences: [] }),
  });

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
      answer: JSON.stringify({ sentences: [] }),
    });
    deleting = deleteProfile(userId, profile!.id);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  await deleting;

  const [row] = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  expect(row).toMatchObject({ profileId: null, question: null, answer: null });
  expect(row!.clearedAt).not.toBeNull();
});
