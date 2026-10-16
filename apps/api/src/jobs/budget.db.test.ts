import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../db/client.js";
import { env } from "../config/env.js";
import { assistantQuestions, jobs, profiles, reports } from "../db/schema.js";
import { getSpendSummary, isOverBudget } from "../modules/spend/spend.service.js";
import { parkIfOverBudget } from "./budget.js";

/**
 * Inserts a finished job whose Claude output costs the given US cents at Sonnet 5.5 prices.
 *
 * @remarks
 * A job with token totals and no usage is priced at Sonnet 5.5, where 1,000 output tokens cost 1 cent.
 */
async function insertSpend(cents: number) {
  await db.insert(jobs).values({
    kind: "process_report",
    payload: { reportId: randomUUID() },
    status: "done",
    inputTokens: 0,
    outputTokens: cents * 1000,
  });
}

async function newRunningJob() {
  const userId = randomUUID();
  const [profile] = await db
    .insert(profiles)
    .values({ ownerUserId: userId, name: "Test", relation: "self", ancestry: "south_asian" })
    .returning({ id: profiles.id });
  const [report] = await db
    .insert(reports)
    .values({ profileId: profile!.id, sourceKind: "pdf" })
    .returning({ id: reports.id });
  const [job] = await db
    .insert(jobs)
    .values({
      kind: "process_report",
      payload: { reportId: report!.id, userId },
      status: "running",
    })
    .returning();
  return { job: job!, reportId: report!.id };
}

test("the monthly Claude cap lets a job run below the limit and parks it at the limit", async () => {
  await insertSpend(99);
  const below = await newRunningJob();
  expect(await parkIfOverBudget(below.job)).toBe(false);

  await insertSpend(1);
  const atCap = await newRunningJob();
  expect(await parkIfOverBudget(atCap.job)).toBe(true);

  const [job] = await db.select().from(jobs).where(eq(jobs.id, atCap.job.id));
  const [report] = await db.select().from(reports).where(eq(reports.id, atCap.reportId));
  expect(job?.status).toBe("paused_budget");
  expect(report?.status).toBe("paused");
});

/** Inserts an assistant question whose Haiku 5.5 output costs 1 cent: 20,000 output tokens at 50 cents per million. */
async function insertQuestionSpend(
  userId: string,
  extra: Partial<typeof assistantQuestions.$inferInsert> = {},
) {
  await db.insert(assistantQuestions).values({
    userId,
    question: "",
    answer: JSON.stringify({ sentences: [] }),
    usage: {
      model: "claude-haiku-5-5",
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 20_000,
    },
    ...extra,
  });
}

test("an assistant question counts in the month total, also after clear, and last month adds nothing", async () => {
  const userId = randomUUID();
  const before = await getSpendSummary();

  await insertQuestionSpend(userId);
  await insertQuestionSpend(userId, { clearedAt: new Date() });
  await insertQuestionSpend(userId, {
    createdAt: new Date(new Date().setUTCDate(0)),
  });

  const after = await getSpendSummary();
  expect(after.costCents - before.costCents).toBeCloseTo(2);
  expect(after.questions - before.questions).toBe(2);
});

test("assistant questions alone can reach the monthly cap", async () => {
  const cap = env.CLAUDE_MONTHLY_CAP_CENTS;
  try {
    env.CLAUDE_MONTHLY_CAP_CENTS = (await getSpendSummary()).costCents + 0.5;
    expect(await isOverBudget()).toBe(false);
    await insertQuestionSpend(randomUUID());
    expect(await isOverBudget()).toBe(true);
  } finally {
    env.CLAUDE_MONTHLY_CAP_CENTS = cap;
  }
});
