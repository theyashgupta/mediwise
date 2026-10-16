import { eq, not, like } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "./client.js";
import { episodes, profiles, reports, userKeys } from "./schema.js";
import {
  type DataKey,
  decryptField,
  encryptField,
  newDataKey,
  unwrapKey,
  wrapKey,
} from "../lib/crypto.js";

type MasterKeys = { newest: string; byId: ReadonlyMap<string, Buffer> };

export const masterKeys: MasterKeys = {
  newest: env.DATA_KEY_V2 ? "v2" : "v1",
  byId: new Map(
    Object.entries({ v1: env.DATA_KEY_V1, v2: env.DATA_KEY_V2 }).flatMap(([id, value]) =>
      value ? [[id, Buffer.from(value, "base64")] as const] : [],
    ),
  ),
};

export type Cipher = {
  keyId: string;
  encrypt: <T extends string | null | undefined>(value: T) => T;
  decrypt: <T extends string | null | undefined>(value: T) => T;
  encryptJson: <T>(value: T) => string | Extract<T, null | undefined>;
  decryptJson: <T>(value: string | null | undefined) => T | null;
};

const cacheLimit = 1000;
const cache = new Map<string, DataKey>();
const forgotten = new Map<string, number>();

/**
 * Wraps one data key in the helpers the repos call.
 *
 * @remarks
 * Null and undefined pass through, so an optional field of a patch stays unset.
 */
function cipherOf(key: DataKey): Cipher {
  const encrypt = <T extends string | null | undefined>(value: T) =>
    (value == null ? value : encryptField(key, value)) as T;
  const decrypt = <T extends string | null | undefined>(value: T) =>
    (value == null ? value : decryptField(key, value)) as T;
  return {
    keyId: key.id,
    encrypt,
    decrypt,
    encryptJson: <T>(value: T) =>
      (value == null ? value : encrypt(JSON.stringify(value))) as
        string | Extract<T, null | undefined>,
    decryptJson: <T>(value: string | null | undefined) =>
      value == null ? null : (JSON.parse(decrypt(value)) as T),
  };
}

/**
 * Loads the data key of a user, and makes and stores one on first use.
 *
 * @remarks
 * The insert does nothing on conflict and the row is read again, so two first calls at once agree on one key. Unwrapped
 * keys stay in memory for up to 1,000 users, the oldest dropped first. A key read while the account delete ran is not
 * cached, so a deleted key never serves a later write.
 */
async function dataKeyOf(userId: string) {
  const cached = cache.get(userId);
  if (cached) return cached;
  const deletes = forgotten.get(userId);
  const select = () =>
    db
      .select()
      .from(userKeys)
      .where(eq(userKeys.userId, userId))
      .then(([row]) => row);
  let row = await select();
  if (!row) {
    const fresh = newDataKey();
    const master = masterKeys.byId.get(masterKeys.newest)!;
    await db
      .insert(userKeys)
      .values({
        userId,
        keyId: fresh.id,
        wrappedKey: wrapKey(fresh.key, masterKeys.newest, master),
      })
      .onConflictDoNothing();
    row = (await select())!;
  }
  const key = { id: row.keyId, key: unwrapKey(row.wrappedKey, masterKeys.byId) };
  if (forgotten.get(userId) !== deletes) return key;
  if (cache.size >= cacheLimit) cache.delete(cache.keys().next().value!);
  cache.set(userId, key);
  return key;
}

export async function cipherFor(userId: string) {
  return cipherOf(await dataKeyOf(userId));
}

/** Drops a user's key from memory, after the account delete removed its row. */
export function forgetUserKey(userId: string) {
  cache.delete(userId);
  forgotten.set(userId, (forgotten.get(userId) ?? 0) + 1);
}

async function ownerCipher(rows: Promise<{ owner: string }[]>) {
  const [row] = await rows;
  return row ? cipherFor(row.owner) : undefined;
}

/** Returns the cipher of the owner of a profile, or undefined when the profile is gone. */
export const cipherForProfile = (profileId: string) =>
  ownerCipher(
    db.select({ owner: profiles.ownerUserId }).from(profiles).where(eq(profiles.id, profileId)),
  );

/** Returns the cipher of the owner of a report, or undefined when the report is gone. */
export const cipherForReport = (reportId: string) =>
  ownerCipher(
    db
      .select({ owner: profiles.ownerUserId })
      .from(reports)
      .innerJoin(profiles, eq(profiles.id, reports.profileId))
      .where(eq(reports.id, reportId)),
  );

/** Returns the cipher of the owner of an episode, or undefined when the episode is gone. */
export const cipherForEpisode = (episodeId: string) =>
  ownerCipher(
    db
      .select({ owner: profiles.ownerUserId })
      .from(episodes)
      .innerJoin(profiles, eq(profiles.id, episodes.profileId))
      .where(eq(episodes.id, episodeId)),
  );

/**
 * Wraps every user key again with the newest master key, and returns how many rows changed.
 *
 * @remarks
 * The data keys stay the same, so no encrypted row changes. Each row is its own update, so a stopped run resumes.
 */
export async function rewrapUserKeys(keys: MasterKeys = masterKeys) {
  const rows = await db
    .select()
    .from(userKeys)
    .where(not(like(userKeys.wrappedKey, `${keys.newest}.%`)));
  const master = keys.byId.get(keys.newest)!;
  for (const row of rows) {
    const wrappedKey = wrapKey(unwrapKey(row.wrappedKey, keys.byId), keys.newest, master);
    await db.update(userKeys).set({ wrappedKey }).where(eq(userKeys.id, row.id));
    cache.delete(row.userId);
  }
  return rows.length;
}
