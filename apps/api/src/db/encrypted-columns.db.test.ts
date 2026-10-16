import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { cipherFor } from "./user-keys.js";
import { db } from "./client.js";
import {
  backfillTable,
  countPlaintext,
  encryptBackfill,
  encryptedColumns,
  rekeyRows,
} from "./encrypted-columns.js";
import {
  assistantQuestions,
  episodes,
  findings,
  profiles,
  reportFiles,
  reports,
} from "./schema.js";

const backfillAll = async () => {
  let changed = 0;
  for (const entry of encryptedColumns) changed += await backfillTable(entry);
  return changed;
};

/** Writes one row of every encrypted table in plaintext, as the API stored it before encryption, plus `files` file rows. */
async function legacyRows(files: number) {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({
      ownerUserId: userId,
      name: "Legacy Asha",
      relation: "self",
      ancestry: "unknown",
      dateOfBirth: "1984-03-02",
      yearReviewIntro: JSON.stringify({ hash: "h", sentences: ["Legacy intro."] }),
    })
    .returning({ id: profiles.id });
  const [episode] = await db
    .insert(episodes)
    .values({ profileId: profile!.id, name: "Legacy fever", note: null, startedOn: "2025-01-01" })
    .returning({ id: episodes.id });
  const [report] = await db
    .insert(reports)
    .values({
      profileId: profile!.id,
      sourceKind: "pdf",
      title: "Legacy title",
      note: "v1: notes from the clinic",
      doctorQuestions: JSON.stringify(["Legacy question?"]),
    })
    .returning({ id: reports.id });
  await db.insert(reportFiles).values(
    Array.from({ length: files }, (_, index) => ({
      reportId: report!.id,
      storagePath: `${userId}/${index}.pdf`,
      mime: "application/pdf",
      size: 1,
      pageIndex: index,
      name: `legacy-${index}.pdf`,
    })),
  );
  await db.insert(findings).values({
    reportId: report!.id,
    kind: "risk",
    severity: "watch",
    title: "Legacy finding",
    body: "Legacy body",
    citedKeys: [],
    citedStudyIds: [],
    rank: 1,
  });
  await db.insert(assistantQuestions).values({
    userId,
    profileId: profile!.id,
    question: "Legacy question text?",
    answer: JSON.stringify({ sentences: [] }),
  });
  return { userId, profileId: profile!.id, episodeId: episode!.id, reportId: report!.id };
}

async function stored({
  profileId,
  episodeId,
  reportId,
  userId,
}: Awaited<ReturnType<typeof legacyRows>>) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
  const [episode] = await db.select().from(episodes).where(eq(episodes.id, episodeId));
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId));
  const files = await db.select().from(reportFiles).where(eq(reportFiles.reportId, reportId));
  const [finding] = await db.select().from(findings).where(eq(findings.reportId, reportId));
  const [question] = await db
    .select()
    .from(assistantQuestions)
    .where(eq(assistantQuestions.userId, userId));
  return {
    profile: profile!,
    episode: episode!,
    report: report!,
    files,
    finding: finding!,
    question: question!,
  };
}

test("the backfill encrypts every plaintext value in batches, a second run changes nothing, and the count is zero", async () => {
  const legacy = await legacyRows(501);

  expect(await backfillAll()).toBeGreaterThanOrEqual(506);

  const first = await stored(legacy);
  const values = [
    first.profile.name,
    first.profile.dateOfBirth,
    first.profile.yearReviewIntro,
    first.episode.name,
    first.report.title,
    first.report.note,
    first.report.doctorQuestions,
    first.finding.title,
    first.finding.body,
    first.question.question,
    first.question.answer,
    ...first.files.map(({ name }) => name),
  ];
  expect(values).toHaveLength(512);
  for (const value of values) expect(value).toMatch(/^v1:/);
  expect([
    first.episode.note,
    first.episode.summary,
    first.report.narrative,
    first.report.error,
  ]).toEqual([null, null, null, null]);

  const cipher = await cipherFor(legacy.userId);
  expect(cipher.decrypt(first.profile.name)).toBe("Legacy Asha");
  expect(cipher.decrypt(first.profile.dateOfBirth)).toBe("1984-03-02");
  expect(cipher.decrypt(first.report.note)).toBe("v1: notes from the clinic");
  expect(cipher.decryptJson(first.report.doctorQuestions)).toEqual(["Legacy question?"]);
  expect(cipher.decrypt(first.files.find(({ pageIndex }) => pageIndex === 500)!.name)).toBe(
    "legacy-500.pdf",
  );

  const second = await encryptBackfill(undefined);
  expect(Object.values(second.encrypted).every((rows) => rows === 0)).toBe(true);
  expect(Object.values(second.plaintext).every((count) => count === 0)).toBe(true);
  expect(await stored(legacy)).toEqual(first);
  expect(await encryptBackfill("count")).toEqual({ encrypted: {}, plaintext: second.plaintext });
});

test("the count names each column that still holds plaintext", async () => {
  await backfillAll();
  await legacyRows(1);

  const counts = await countPlaintext();

  expect(counts).toMatchObject({ "profiles.name": 1, "reports.title": 1, "report_files.name": 1 });
  expect(counts["reports.narrative"]).toBe(0);
  await backfillAll();
});

test("rows moved to another user are encrypted again under that user's key", async () => {
  const legacy = await legacyRows(1);
  await backfillAll();
  const from = await cipherFor(legacy.userId);
  const owner = randomUUID();

  await db.transaction(async (tx) => {
    await tx.update(profiles).set({ ownerUserId: owner }).where(eq(profiles.id, legacy.profileId));
    await rekeyRows(tx, from, owner);
  });

  const to = await cipherFor(owner);
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, legacy.profileId));
  const [report] = await db
    .select()
    .from(reports)
    .where(inArray(reports.id, [legacy.reportId]));
  expect(to.decrypt(profile!.name)).toBe("Legacy Asha");
  expect(to.decrypt(report!.title)).toBe("Legacy title");
  expect(() => from.decrypt(profile!.name)).toThrow("another data key");
});
