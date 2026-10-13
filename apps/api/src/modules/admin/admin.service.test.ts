import { afterEach, expect, test, vi } from "vitest";
import { log } from "../../middleware/logger.js";
import {
  alertsFor,
  errorClass,
  getOverview,
  logAlerts,
  periodStarts,
  retryFailedReport,
} from "./admin.service.js";

const now = new Date("2026-10-14T05:00:00Z");
const sonnet = (cents: number, at: string, status = "done") => ({
  status,
  usage: null,
  inputTokens: 0,
  outputTokens: cents * 1000,
  updatedAt: new Date(at),
});

vi.mock("./admin.repo.js", () => ({
  listJobsSince: async () => [
    sonnet(1, "2026-10-14T01:00:00Z"),
    sonnet(2, "2026-10-12T01:00:00Z"),
    sonnet(4, "2026-10-04T01:00:00Z", "failed"),
  ],
  listQuestionsSince: async () => [
    {
      createdAt: new Date("2026-10-14T02:00:00Z"),
      usage: {
        model: "claude-haiku-5-5",
        inputTokens: 0,
        cachedInputTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 20_000,
      },
    },
    { createdAt: new Date("2026-10-13T02:00:00Z"), usage: null },
  ],
  findQueue: async () => ({ depth: 1, oldestAt: new Date("2026-10-14T04:00:00Z") }),
  listFailedReports: async () => [
    {
      id: "r1",
      createdAt: new Date("2026-10-13T00:00:00Z"),
      reportError: "This file is already in your reports.",
      jobError: null,
    },
  ],
  sumCreditsByReason: async () => [
    { reason: "grant", total: 5 },
    { reason: "upload", total: -3 },
    { reason: "refund", total: 1 },
  ],
  countProfiles: async () => ({ profiles: 2, users: 1, activeProfiles: 1, activeUsers: 1 }),
  findReportOwner: async () => undefined,
}));

vi.mock("../spend/spend.repo.js", () => ({
  listJobsThisMonth: async () => [],
  listQuestionsThisMonth: async () => [],
  findPurchasesThisMonth: async () => ({ purchases: 0, revenuePaise: 0 }),
}));

afterEach(() => vi.restoreAllMocks());

const minute = 60_000;

test("the spend alert holds from 80 percent of the monthly cap", () => {
  expect(alertsFor(1599, 2000, null)).toEqual([]);
  expect(alertsFor(1600, 2000, null)).toEqual(["spend"]);
  expect(alertsFor(2500, 2000, null)).toEqual(["spend"]);
});

test("the queue alert holds when a queued job is older than 30 minutes", () => {
  expect(alertsFor(0, 2000, 30 * minute)).toEqual([]);
  expect(alertsFor(0, 2000, 30 * minute + 1)).toEqual(["queue"]);
  expect(alertsFor(1600, 2000, 31 * minute)).toEqual(["spend", "queue"]);
});

test("a failed read gets a fixed error class, never its raw error text", () => {
  expect(errorClass("This file is damaged or is not a PDF. Upload the report again.", null)).toBe(
    "unreadable_file",
  );
  expect(errorClass("We found no lab values in this file. Upload a lab report.", null)).toBe(
    "no_values",
  );
  expect(errorClass("This file is already in your reports.", null)).toBe("duplicate");
  expect(errorClass("You have no report credits left.", null)).toBe("no_credits");
  const generic = "We could not read this report. Try again in a few minutes.";
  expect(errorClass(generic, "529 Overloaded")).toBe("upstream");
  expect(errorClass(generic, "The worker stopped while running this job")).toBe("worker_stopped");
  expect(errorClass(generic, "Cannot read properties of undefined")).toBe("unexpected");
  expect(errorClass(null, null)).toBe("unexpected");
});

test("today, this week and this month start at UTC midnight, Monday and the first", () => {
  const starts = periodStarts(new Date("2026-10-14T05:00:00Z"));
  expect(new Date(starts.day).toISOString()).toBe("2026-10-14T00:00:00.000Z");
  expect(new Date(starts.week).toISOString()).toBe("2026-10-12T00:00:00.000Z");
  expect(new Date(starts.month).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  const sunday = periodStarts(new Date("2026-11-01T23:00:00Z"));
  expect(new Date(sunday.week).toISOString()).toBe("2026-10-26T00:00:00.000Z");
});

test("the overview adds question cost to today and this week, and counts reads per UTC day", async () => {
  const overview = await getOverview(now);

  expect(overview.spend).toMatchObject({ todayCents: 2, weekCents: 4, monthCents: 0 });
  expect(overview.days.at(-1)).toEqual({ date: "2026-10-14", reads: 1, costCents: 1 });
  expect(overview.days.at(-3)).toEqual({ date: "2026-10-12", reads: 1, costCents: 2 });
  expect(overview.meanCostPerReadCents).toBe(3.5);
  expect(overview.failed).toEqual([
    { id: "r1", createdAt: "2026-10-13T00:00:00.000Z", errorClass: "duplicate" },
  ]);
  expect(overview.queue).toEqual({ depth: 1, oldestQueuedMs: 60 * minute });
  expect(overview.credits).toEqual({
    granted: 5,
    purchased: 0,
    spentOnReads: 2,
    spentOnQuestions: 0,
  });
  expect(overview.alerts).toEqual(["queue"]);
});

test("the alert check writes one structured warning per alert, at most every 15 minutes", async () => {
  const warn = vi.spyOn(log, "warn").mockImplementation(() => undefined);
  await logAlerts(now);
  await logAlerts(new Date(now.getTime() + 14 * minute));

  expect(warn.mock.calls).toEqual([["alert kind=queue depth=1 oldest_minutes=60"]]);
});

test("a retry of a report that does not exist is a 404", async () => {
  await expect(retryFailedReport("missing")).rejects.toMatchObject({ status: 404 });
});
