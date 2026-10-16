import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "./client.js";
import { userKeys } from "./schema.js";
import { CipherError } from "../lib/crypto.js";
import { cipherFor, forgetUserKey, masterKeys, rewrapUserKeys } from "./user-keys.js";

const rowsOf = (userId: string) => db.select().from(userKeys).where(eq(userKeys.userId, userId));

test("a user's first encrypt stores one wrapped key, and later calls reuse it", async () => {
  const userId = randomUUID();
  const value = (await cipherFor(userId)).encrypt("Asha Rao");
  forgetUserKey(userId);

  expect((await cipherFor(userId)).decrypt(value)).toBe("Asha Rao");
  const rows = await rowsOf(userId);
  expect(rows).toHaveLength(1);
  expect(value.split(":")[1]).toBe(rows[0]!.keyId);
  expect(rows[0]!.wrappedKey).toMatch(/^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
});

test("a key read while the account delete runs is not cached, so the next call makes a new key", async () => {
  const userId = randomUUID();
  const reading = cipherFor(userId);
  forgetUserKey(userId);
  const stale = await reading;
  await db.delete(userKeys).where(eq(userKeys.userId, userId));

  const fresh = await cipherFor(userId);

  expect(fresh.keyId).not.toBe(stale.keyId);
});

test("parallel first calls for one user agree on one key", async () => {
  const userId = randomUUID();
  const ciphers = await Promise.all(Array.from({ length: 5 }, () => cipherFor(userId)));
  const value = ciphers[0]!.encrypt("Asha Rao");

  for (const cipher of ciphers) expect(cipher.decrypt(value)).toBe("Asha Rao");
  expect(await rowsOf(userId)).toHaveLength(1);
});

test("JSON values round trip and null stays null", async () => {
  const cipher = await cipherFor(randomUUID());
  const intro = { hash: "abc", sentences: ["One sentence."] };

  expect(cipher.decryptJson(cipher.encryptJson(intro))).toEqual(intro);
  expect(cipher.encryptJson(null)).toBeNull();
  expect(cipher.encrypt(null)).toBeNull();
  expect(cipher.decrypt(undefined)).toBeUndefined();
});

test("two users' keys do not open each other's values", async () => {
  const alice = await cipherFor(randomUUID());
  const bob = await cipherFor(randomUUID());

  expect(() => bob.decrypt(alice.encrypt("Asha Rao"))).toThrow(CipherError);
});

test("a rewrap to a master key the API does not have leaves the data key unreadable, closed", async () => {
  const userId = randomUUID();
  const value = (await cipherFor(userId)).encrypt("Asha Rao");
  const v2 = Buffer.alloc(32, 9);
  const withV2 = { newest: "v2", byId: new Map([...masterKeys.byId, ["v2", v2]]) };

  expect(await rewrapUserKeys(withV2)).toBeGreaterThanOrEqual(1);
  const [row] = await rowsOf(userId);
  expect(row!.wrappedKey.startsWith("v2.")).toBe(true);

  forgetUserKey(userId);
  await expect(cipherFor(userId)).rejects.toThrow("names a master key that is not set");

  await rewrapUserKeys({ newest: "v1", byId: withV2.byId });
  forgetUserKey(userId);
  expect((await cipherFor(userId)).decrypt(value)).toBe("Asha Rao");
});
