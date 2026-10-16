import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { episodes, profiles } from "../../db/schema.js";
import { cipherFor } from "../../db/user-keys.js";
import {
  findOwnedEpisode,
  insertEpisode,
  listEpisodes,
  saveSummary,
  updateEpisode,
} from "./episodes.repo.js";

async function ownedProfile() {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({
      ownerUserId: userId,
      name: (await cipherFor(userId)).encrypt("Asha"),
      relation: "self",
      ancestry: "unknown",
    })
    .returning({ id: profiles.id });
  return { userId, profileId: profile!.id };
}

const rawEpisode = async (id: string) =>
  (await db.select().from(episodes).where(eq(episodes.id, id)))[0]!;

test("an episode's name, note and summary are stored as v1: strings and read back as written", async () => {
  const { userId, profileId } = await ownedProfile();
  const { id } = await insertEpisode(
    { profileId, name: "Fever in May", note: "Started after travel", startedOn: "2025-05-01" },
    [],
  );
  await saveSummary(id, { hash: "h", sentences: ["The fever settled."] });

  const raw = await rawEpisode(id);
  for (const column of [raw.name, raw.note, raw.summary]) expect(column).toMatch(/^v1:/);
  expect(JSON.stringify(raw)).not.toContain("Fever");

  expect(await findOwnedEpisode(userId, id)).toMatchObject({
    name: "Fever in May",
    note: "Started after travel",
    summary: { hash: "h", sentences: ["The fever settled."] },
  });
  expect(await listEpisodes(profileId)).toMatchObject([
    { name: "Fever in May", note: "Started after travel" },
  ]);
});

test("an episode update encrypts the fields it sets and leaves the others as they were", async () => {
  const { userId, profileId } = await ownedProfile();
  const { id } = await insertEpisode(
    { profileId, name: "Fever", note: null, startedOn: "2025-05-01" },
    [],
  );

  await updateEpisode(id, { note: "A new note", endedOn: "2025-05-09" });

  const raw = await rawEpisode(id);
  expect(raw.note).toMatch(/^v1:/);
  expect(await findOwnedEpisode(userId, id)).toMatchObject({
    name: "Fever",
    note: "A new note",
    endedOn: "2025-05-09",
  });
});

test("another owner gets no episode", async () => {
  const { profileId } = await ownedProfile();
  const { id } = await insertEpisode(
    { profileId, name: "Fever", note: null, startedOn: "2025-05-01" },
    [],
  );

  expect(await findOwnedEpisode(randomUUID(), id)).toBeUndefined();
});
