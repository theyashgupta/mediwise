import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../db/client.js";
import { jobs, profiles, reports } from "../db/schema.js";
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
