import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  clearedQuestion,
  deletionLog,
  jobs,
  profiles,
} from "../../db/schema.js";
import {
  blankJobErrors,
  deleteClearedQuestions,
  deleteDeletionLogRows,
  deleteFinishedJobs,
} from "./retention.repo.js";

const day = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * day);
const statuses = ["queued", "running", "paused_budget", "done", "failed"] as const;

async function insertJob(
  status: (typeof statuses)[number],
  updatedAt: Date | ReturnType<typeof sql>,
) {
  const [job] = await db
    .insert(jobs)
    .values({
      kind: "process_report",
      payload: { reportId: randomUUID() },
      status,
      error: "Claude could not read page 2",
      updatedAt,
    })
    .returning({ id: jobs.id });
  return job!.id;
}

const statusesOf = async (ids: string[]) =>
  (await db.select({ status: jobs.status }).from(jobs).where(inArray(jobs.id, ids)))
    .map(({ status }) => status)
    .toSorted();

test("the sweep deletes done and failed jobs older than 30 days and never a queued, running or parked job", async () => {
  const old = await Promise.all(statuses.map((status) => insertJob(status, daysAgo(31))));
  const recent = await Promise.all(statuses.map((status) => insertJob(status, daysAgo(29))));

  expect(await deleteFinishedJobs(daysAgo(30))).toBeGreaterThanOrEqual(2);

  expect(await statusesOf(old)).toEqual(["paused_budget", "queued", "running"]);
  expect(await statusesOf(recent)).toEqual([...statuses].toSorted());
});

test("the sweep keeps a done job of the current month, which the spend cap still counts", async () => {
  const id = await insertJob("done", sql`date_trunc('month', now())`);

  await deleteFinishedJobs(new Date());

  expect(await statusesOf([id])).toEqual(["done"]);
});

test("the sweep blanks job errors older than 7 days and keeps the update time", async () => {
  const old = await insertJob("failed", daysAgo(8));
  const recent = await insertJob("failed", daysAgo(6));

  await blankJobErrors(daysAgo(7));

  const rows = await db
    .select({ id: jobs.id, error: jobs.error, updatedAt: jobs.updatedAt })
    .from(jobs)
    .where(inArray(jobs.id, [old, recent]));
  expect(rows.find((row) => row.id === old)).toMatchObject({ error: null });
  expect(rows.find((row) => row.id === old)!.updatedAt.getTime()).toBeLessThan(
    daysAgo(7.9).getTime(),
  );
  expect(rows.find((row) => row.id === recent)?.error).toBe("Claude could not read page 2");
});

test("the sweep deletes deletion log rows older than 2 years", async () => {
  const [old, recent] = await db
    .insert(deletionLog)
    .values(
      [daysAgo(2 * 366), daysAgo(700)].map((deletedAt) => ({
        userIdHash: randomUUID(),
        scope: "account" as const,
        counts: { profiles: 1, reports: 0, files: 0 },
        deletedAt,
      })),
    )
    .returning({ id: deletionLog.id });

  await deleteDeletionLogRows(daysAgo(2 * 365));

  const left = await db
    .select({ id: deletionLog.id })
    .from(deletionLog)
    .where(inArray(deletionLog.id, [old!.id, recent!.id]));
  expect(left).toEqual([{ id: recent!.id }]);
});

test("the sweep deletes cleared questions after 90 days but keeps a charged one of a live account", async () => {
  const live = randomUUID();
  const deleted = randomUUID();
  await db
    .insert(profiles)
    .values({ ownerUserId: live, name: "Test", relation: "self", ancestry: "unknown" });
  const rows = [
    { userId: live, charged: true, clearedAt: daysAgo(91) },
    { userId: live, charged: false, clearedAt: daysAgo(91) },
    { userId: live, charged: false, clearedAt: daysAgo(89) },
    { userId: deleted, charged: true, clearedAt: daysAgo(91) },
  ];
  const ids = [];
  for (const row of rows) {
    const [inserted] = await db
      .insert(assistantQuestions)
      .values({ ...row, ...clearedQuestion, clearedAt: row.clearedAt })
      .returning({ id: assistantQuestions.id });
    ids.push(inserted!.id);
  }
  const [question] = await db
    .insert(assistantQuestions)
    .values({ userId: live, question: "What was my HbA1c?", answer: { sentences: [] } })
    .returning({ id: assistantQuestions.id });

  await deleteClearedQuestions(daysAgo(90));

  const left = await db
    .select({ id: assistantQuestions.id })
    .from(assistantQuestions)
    .where(inArray(assistantQuestions.id, [...ids, question!.id]));
  expect(left.map(({ id }) => id).toSorted()).toEqual([ids[0], ids[2], question!.id].toSorted());
  expect(
    await db.select().from(assistantQuestions).where(eq(assistantQuestions.userId, deleted)),
  ).toEqual([]);
});
