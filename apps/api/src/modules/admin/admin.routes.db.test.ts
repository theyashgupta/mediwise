import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import { db } from "../../db/client.js";
import {
  denseHistoryProfile,
  denseHistoryReports,
  insertDenseHistory,
} from "../../db/dense-history.js";
import { assistantQuestions, creditsLedger, jobs, profiles, reports } from "../../db/schema.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { adminRoutes } from "./admin.routes.js";
import { type getOverview, periodStarts } from "./admin.service.js";

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "");
    await next();
  })
  .route("/admin", adminRoutes);
app.onError(handleError);

const admin = { headers: { "x-user": "admin-user" } };
const dayMs = 86_400_000;
const now = new Date();
const starts = periodStarts(now);
const today = new Date(starts.day + 1000);
const tenDaysAgo = new Date(starts.day - 10 * dayMs + 1000);
const fortyDaysAgo = new Date(starts.day - 40 * dayMs + 1000);
const reportTitle = "Made-up title that must stay off the admin page";
let duplicateId = "";

/**
 * Empties the tables the overview sums over every user.
 *
 * @remarks
 * The overview counts every user, so rows of other db test files would change its numbers. Files run one at a time.
 */
async function emptyTables() {
  await db.execute(
    sql`truncate ${jobs}, ${assistantQuestions}, ${creditsLedger}, ${profiles} cascade`,
  );
}

/** Inserts a job whose Claude output costs the given US cents at Sonnet 5.5 prices. */
function spendJob(
  cents: number,
  status: "done" | "failed",
  at: Date,
  reportId: string = randomUUID(),
) {
  return {
    kind: "process_report",
    payload: { reportId },
    status,
    inputTokens: 0,
    outputTokens: cents * 1000,
    createdAt: at,
    updatedAt: at,
  };
}

beforeAll(async () => {
  await emptyTables();
  const userA = randomUUID();
  const userB = randomUUID();
  const userC = randomUUID();
  const dense = await insertDenseHistory(
    userA,
    denseHistoryReports(today.toISOString().slice(0, 10)),
  );
  const [profileB, profileC] = await db
    .insert(profiles)
    .values([
      { ownerUserId: userB, name: "Made-up Member", relation: "self", ancestry: "south_asian" },
      { ownerUserId: userC, name: "Made-up Quiet", relation: "self", ancestry: "south_asian" },
    ])
    .returning({ id: profiles.id });
  const failed = await db
    .insert(reports)
    .values([
      {
        profileId: profileB!.id,
        sourceKind: "pdf",
        status: "failed",
        title: reportTitle,
        error: "We could not read this report. Try again in a few minutes.",
        createdAt: new Date(now.getTime() - 60_000),
      },
      {
        profileId: profileB!.id,
        sourceKind: "pdf",
        status: "failed",
        title: reportTitle,
        error: "This file is already in your reports.",
        createdAt: new Date(now.getTime() - 120_000),
      },
      {
        profileId: profileC!.id,
        sourceKind: "pdf",
        status: "done",
        createdAt: new Date(starts.day - 60 * dayMs),
      },
      { profileId: profileC!.id, sourceKind: "pdf", status: "draft" },
    ])
    .returning({ id: reports.id });
  duplicateId = failed[1]!.id;
  await db.insert(jobs).values([
    spendJob(1, "done", today, dense.reportIds.at(-1)),
    spendJob(3, "done", today),
    { ...spendJob(0.5, "failed", today, failed[0]!.id), error: "529 Overloaded" },
    spendJob(2, "done", tenDaysAgo),
    spendJob(5, "done", fortyDaysAgo),
    {
      kind: "process_report",
      payload: { reportId: randomUUID() },
      status: "queued",
      createdAt: new Date(now.getTime() - 45 * 60_000),
    },
    {
      kind: "process_report",
      payload: { reportId: randomUUID() },
      status: "paused_budget",
      createdAt: new Date(now.getTime() - 5 * 60_000),
    },
  ]);
  await db.insert(assistantQuestions).values({
    userId: userA,
    question: "Made-up question",
    answer: { sentences: [] },
    usage: {
      model: "claude-haiku-5-5",
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 20_000,
    },
    createdAt: today,
  });
  await db.insert(creditsLedger).values([
    { userId: userA, delta: 5, reason: "grant" },
    { userId: userA, delta: 10, reason: "purchase" },
    { userId: userA, delta: -1, reason: "upload" },
    { userId: userA, delta: -1, reason: "upload" },
    { userId: userB, delta: -1, reason: "upload" },
    { userId: userB, delta: 1, reason: "refund" },
    { userId: userA, delta: -2, reason: "questions" },
  ]);
});

afterAll(emptyTables);

test("the admin overview counts spend, reads, failed reads, queue, credits and profiles on the dense fixture", async () => {
  env.ADMIN_USER_ID = "admin-user";
  const res = await app.request("/admin/overview", admin);
  expect(res.status).toBe(200);
  const overview = (await res.json()) as Awaited<ReturnType<typeof getOverview>>;
  const tenDaysAgoInMonth = tenDaysAgo.getTime() >= starts.month;

  expect(overview.spend).toEqual({
    todayCents: 5.5,
    weekCents: 5.5,
    monthCents: tenDaysAgoInMonth ? 7.5 : 5.5,
    capCents: 100,
    hardStop: false,
    reads: tenDaysAgoInMonth ? 3 : 2,
    questions: 1,
    purchases: 0,
    revenuePaise: 0,
  });
  expect(overview.days).toHaveLength(30);
  expect(overview.days.at(-1)).toEqual({
    date: now.toISOString().slice(0, 10),
    reads: 2,
    costCents: 4.5,
  });
  expect(overview.days.at(-11)).toEqual({
    date: tenDaysAgo.toISOString().slice(0, 10),
    reads: 1,
    costCents: 2,
  });
  expect(overview.days.reduce((sum, day) => sum + day.reads, 0)).toBe(3);
  expect(overview.meanCostPerReadCents).toBe(2.17);
  expect(overview.failed.map((report) => report.errorClass)).toEqual(["upstream", "duplicate"]);
  expect(Object.keys(overview.failed[0]!).toSorted()).toEqual(["createdAt", "errorClass", "id"]);
  expect(overview.queue.depth).toBe(2);
  expect(Math.round((overview.queue.oldestQueuedMs ?? 0) / 60_000)).toBe(45);
  expect(overview.credits).toEqual({
    granted: 5,
    purchased: 10,
    spentOnReads: 2,
    spentOnQuestions: 2,
  });
  expect(overview.people).toEqual({ profiles: 3, users: 3, activeProfiles: 2, activeUsers: 2 });
  expect(overview.alerts).toEqual(["queue"]);

  const text = JSON.stringify(overview);
  expect(text).not.toContain(denseHistoryProfile.name);
  expect(text).not.toContain("Made-up");
  expect(text).not.toContain(reportTitle);
  expect(text).not.toContain("529");
});

test("the admin retry reads a failed report of another user again", async () => {
  env.ADMIN_USER_ID = "admin-user";
  const res = await app.request(`/admin/reports/${duplicateId}/retry`, {
    method: "POST",
    ...admin,
  });
  expect(res.status).toBe(204);
  const [report] = await db.select().from(reports).where(eq(reports.id, duplicateId));
  expect(report?.status).toBe("queued");
  const queued = await db
    .select()
    .from(jobs)
    .where(sql`${jobs.payload}->>'reportId' = ${duplicateId}`);
  expect(queued.map((job) => job.status)).toEqual(["queued"]);
});
