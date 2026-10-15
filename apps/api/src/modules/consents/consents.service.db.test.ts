import { policyVersion } from "@mediwise/shared";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { AppError } from "../../common/errors.js";
import { db } from "../../db/client.js";
import { consentRecords } from "../../db/schema.js";
import {
  assertHealthDataConsent,
  getConsents,
  giveConsents,
  hasConsent,
} from "./consents.service.js";

const rowsOf = (userId: string) =>
  db.select().from(consentRecords).where(eq(consentRecords.userId, userId));

test("a new user misses the terms and the health data consent", async () => {
  expect(await getConsents(randomUUID())).toEqual({
    policyVersion,
    consents: [],
    missing: ["terms", "health_data"],
  });
});

test("each consent is stored with the current policy version and the SHA-256 of the user agent", async () => {
  const userId = randomUUID();

  const result = await giveConsents(userId, ["terms", "health_data"], "Mozilla/5.0 Test");

  expect(result.missing).toEqual([]);
  const rows = await rowsOf(userId);
  expect(rows).toHaveLength(2);
  for (const row of rows) {
    expect(row.policyVersion).toBe(policyVersion);
    expect(row.userAgentHash).toBe(
      "907a76066e8277153f98ff4c6d15d90597ab5330471855cfe14dc60ba7067843",
    );
    expect(row.withdrawnAt).toBeNull();
  }
});

test("a consent with no user agent header stores no hash", async () => {
  const userId = randomUUID();
  await giveConsents(userId, ["terms"]);
  expect((await rowsOf(userId))[0]?.userAgentHash).toBeNull();
});

test("giving the same consents again adds no row", async () => {
  const userId = randomUUID();
  await giveConsents(userId, ["terms", "health_data"]);
  await giveConsents(userId, ["terms", "health_data", "health_data"]);
  expect(await rowsOf(userId)).toHaveLength(2);
});

test("a health data consent for an older policy version counts as missing and is asked again", async () => {
  const userId = randomUUID();
  await db.insert(consentRecords).values([
    { userId, kind: "terms", policyVersion: "2026-10-13" },
    { userId, kind: "health_data", policyVersion: "2026-10-13" },
  ]);

  expect((await getConsents(userId)).missing).toEqual(["health_data"]);
  expect(await hasConsent(userId, "health_data")).toBe(false);

  await giveConsents(userId, ["terms", "health_data"]);
  const rows = await rowsOf(userId);
  expect(rows.map(({ kind, policyVersion }) => `${kind} ${policyVersion}`).toSorted()).toEqual([
    "health_data 2026-10-13",
    `health_data ${policyVersion}`,
    "terms 2026-10-13",
  ]);
});

test("a withdrawn health data consent no longer counts", async () => {
  const userId = randomUUID();
  await db.insert(consentRecords).values({
    userId,
    kind: "health_data",
    policyVersion,
    withdrawnAt: new Date(),
  });
  expect(await hasConsent(userId, "health_data")).toBe(false);
});

test("the upload guard refuses a user with no health data consent with a 403 that names it", async () => {
  const userId = randomUUID();
  const error = await assertHealthDataConsent(userId).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(AppError);
  expect(error).toMatchObject({ status: 403, extensions: { missingConsent: "health_data" } });

  await giveConsents(userId, ["health_data"]);
  await expect(assertHealthDataConsent(userId)).resolves.toBeUndefined();
});

test("the database refuses a consent with an empty policy version", async () => {
  await expect(
    db.insert(consentRecords).values({ userId: randomUUID(), kind: "terms", policyVersion: "" }),
  ).rejects.toThrow();
});

test("two consent requests at the same time store one row per kind", async () => {
  const userId = randomUUID();
  await Promise.all([
    giveConsents(userId, ["terms", "health_data"]),
    giveConsents(userId, ["terms", "health_data"]),
  ]);
  expect((await rowsOf(userId)).map(({ kind }) => kind).toSorted()).toEqual([
    "health_data",
    "terms",
  ]);
});
