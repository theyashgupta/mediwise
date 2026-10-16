import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import { db } from "../../db/client.js";
import {
  assistantQuestions,
  creditsLedger,
  jobs,
  paymentOrders,
  profiles,
  reports,
} from "../../db/schema.js";
import { cipherFor } from "../../lib/user-keys.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { giveConsents } from "../consents/index.js";
import { adminRoutes } from "./admin.routes.js";
import type { getCreditHistory, listFailedReads } from "./admin.service.js";

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "");
    await next();
  })
  .route("/admin", adminRoutes);
app.onError(handleError);

const admin = { headers: { "x-user": "admin-user" } };
const reportTitle = "Made-up title that must stay off the admin page";
const questionText = "Made-up question that must stay off the admin page";
const userA = randomUUID();
const userB = randomUUID();
let duplicateId = "";

type History = Awaited<ReturnType<typeof getCreditHistory>>;

/**
 * Empties the tables the admin page reads over every user.
 *
 * @remarks
 * The history counts every user, so rows of other db test files would change its numbers. Files run one at a time.
 */
async function emptyTables() {
  await db.execute(
    sql`truncate ${jobs}, ${assistantQuestions}, ${creditsLedger}, ${paymentOrders}, ${profiles} cascade`,
  );
}

async function history(query = "") {
  const res = await app.request(`/admin/credits${query}`, admin);
  expect(res.status).toBe(200);
  return (await res.json()) as History;
}

beforeAll(async () => {
  await emptyTables();
  env.ADMIN_USER_ID = "admin-user";
  const [, , profileB] = await db
    .insert(profiles)
    .values([
      { ownerUserId: userA, name: "Made-up Self", relation: "self", ancestry: "south_asian" },
      { ownerUserId: userA, name: "Made-up Parent", relation: "other", ancestry: "south_asian" },
      { ownerUserId: userB, name: "Made-up Member", relation: "self", ancestry: "south_asian" },
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
        createdAt: new Date(Date.now() - 60_000),
      },
      {
        profileId: profileB!.id,
        sourceKind: "pdf",
        status: "failed",
        title: reportTitle,
        error: (await cipherFor(userB)).encrypt("This file is already in your reports."),
        createdAt: new Date(Date.now() - 120_000),
      },
    ])
    .returning({ id: reports.id });
  duplicateId = failed[1]!.id;
  await db.insert(jobs).values({
    kind: "process_report",
    payload: { reportId: failed[0]!.id },
    status: "failed",
    error: "529 Overloaded",
  });
  const orderId = randomUUID();
  await db.insert(paymentOrders).values({
    id: orderId,
    userId: userA,
    packId: "pack_5",
    credits: 5,
    amount: 19900,
    status: "paid",
  });
  const day = (date: string) => new Date(`${date}T10:00:00Z`);
  await db.insert(creditsLedger).values([
    { userId: userA, delta: 3, reason: "grant", createdAt: day("2026-10-01") },
    {
      userId: userA,
      delta: 5,
      reason: "purchase",
      paymentOrderId: orderId,
      paymentRef: `pay-${orderId}`,
      createdAt: day("2026-10-02"),
    },
    {
      userId: userA,
      delta: -1,
      reason: "upload",
      reportId: randomUUID(),
      createdAt: day("2026-10-03"),
    },
    {
      userId: userB,
      delta: -1,
      reason: "upload",
      reportId: duplicateId,
      createdAt: day("2026-10-04"),
    },
    {
      userId: userB,
      delta: 1,
      reason: "refund",
      reportId: duplicateId,
      createdAt: day("2026-10-05"),
    },
    {
      userId: userA,
      delta: -1,
      reason: "questions",
      note: "20 questions",
      createdAt: day("2026-10-06"),
    },
  ]);
  const question = (charged: boolean, date: string) => ({
    userId: userA,
    question: questionText,
    answer: JSON.stringify({ sentences: [] }),
    charged,
    createdAt: day(date),
  });
  await db
    .insert(assistantQuestions)
    .values([
      question(true, "2026-10-07"),
      question(true, "2026-10-08"),
      question(false, "2026-10-08"),
    ]);
});

afterAll(emptyTables);

test("the credit history totals each kind, prices purchases in paise, and counts the profiles of each user", async () => {
  const { reportCredits, questionPacks } = await history();

  expect(reportCredits.totals).toEqual([
    { kind: "grant", events: 1, credits: 3, amountPaise: 0 },
    { kind: "purchase", events: 1, credits: 5, amountPaise: 19900 },
    { kind: "upload", events: 2, credits: -2, amountPaise: 0 },
    { kind: "refund", events: 1, credits: 1, amountPaise: 0 },
    { kind: "purchase_refund", events: 0, credits: 0, amountPaise: 0 },
  ]);
  expect(questionPacks.totals).toEqual([
    { kind: "questions", events: 1, credits: -1, amountPaise: 0 },
    { kind: "question", events: 2, credits: 0, amountPaise: 0 },
  ]);
  expect(reportCredits.events.map((e) => [e.kind, e.profiles, e.amountPaise])).toEqual([
    ["refund", 1, null],
    ["upload", 1, null],
    ["upload", 2, null],
    ["purchase", 2, 19900],
    ["grant", 2, null],
  ]);
  expect(questionPacks.events.map((e) => e.kind)).toEqual(["question", "question", "questions"]);

  const text = JSON.stringify({ reportCredits, questionPacks });
  expect(text).not.toContain("Made-up");
});

test("the date filter includes both days, and the user filter keeps one user", async () => {
  const days = await history("?from=2026-10-03&to=2026-10-05");
  expect(days.reportCredits.events.map((e) => e.kind)).toEqual(["refund", "upload", "upload"]);
  expect(days.questionPacks.events).toEqual([]);

  const one = await history(`?userId=${userB}`);
  expect(one.reportCredits.events.every((e) => e.userId === userB)).toBe(true);
  expect(one.reportCredits.totals.find((t) => t.kind === "upload")?.events).toBe(1);
  expect(one.questionPacks.totals.find((t) => t.kind === "question")?.events).toBe(0);
});

test("the failed reads show an error class and no title, profile name or raw error", async () => {
  const res = await app.request("/admin/failed-reports", admin);
  const failed = (await res.json()) as Awaited<ReturnType<typeof listFailedReads>>;
  expect(failed.map((report) => report.errorClass)).toEqual(["upstream", "duplicate"]);
  expect(Object.keys(failed[0]!).toSorted()).toEqual(["createdAt", "errorClass", "id"]);
  const text = JSON.stringify(failed);
  expect(text).not.toContain(reportTitle);
  expect(text).not.toContain("529 Overloaded");
});

test("the admin retry refuses a report whose owner has no health data consent", async () => {
  const res = await app.request(`/admin/reports/${duplicateId}/retry`, {
    method: "POST",
    ...admin,
  });
  expect(res.status).toBe(403);
  const [report] = await db.select().from(reports).where(eq(reports.id, duplicateId));
  expect(report?.status).toBe("failed");
});

test("the admin retry reads a failed report of another user again", async () => {
  await giveConsents(userB, ["health_data"]);
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
