import { afterEach, expect, test, vi } from "vitest";
import { log } from "../../middleware/logger.js";
import {
  alertsFor,
  errorClass,
  getCreditHistory,
  kindOf,
  ledgerFilter,
  listFailedReads,
  logAlerts,
  retryFailedReport,
} from "./admin.service.js";

const now = new Date("2026-10-14T05:00:00Z");
const at = (iso: string) => new Date(iso);
const ledgerRow = (reason: string, delta: number, createdAt: string, extra = {}) => ({
  id: `${reason}-${createdAt}`,
  createdAt: at(createdAt),
  userId: "user-a",
  reason,
  fromReport: reason === "upload",
  delta,
  amountPaise: null,
  profiles: 2,
  ...extra,
});

vi.mock("./admin.repo.js", () => ({
  findQueue: async () => ({ depth: 1, oldestAt: new Date("2026-10-14T04:00:00Z") }),
  listFailedReports: async () => [
    {
      id: "r1",
      createdAt: new Date("2026-10-13T00:00:00Z"),
      reportError: "This file is already in your reports.",
      jobError: null,
    },
  ],
  listLedgerEvents: async (_filter: unknown, reasons: string[]) =>
    reasons.includes("questions")
      ? [ledgerRow("questions", -1, "2026-10-12T00:00:00Z")]
      : [
          ledgerRow("purchase", 5, "2026-10-13T00:00:00Z", { amountPaise: 19900 }),
          ledgerRow("upload", -1, "2026-10-12T00:00:00Z"),
        ],
  listChargedQuestions: async () => [
    { id: "q1", createdAt: at("2026-10-13T06:00:00Z"), userId: "user-a", profiles: 2 },
  ],
  sumLedger: async () => [
    { reason: "grant", fromReport: false, events: 1, credits: 5, amountPaise: 0 },
    { reason: "purchase", fromReport: false, events: 2, credits: 25, amountPaise: 79800 },
    { reason: "upload", fromReport: true, events: 3, credits: -3, amountPaise: 0 },
    { reason: "refund", fromReport: true, events: 1, credits: 1, amountPaise: 0 },
    { reason: "refund", fromReport: false, events: 1, credits: -5, amountPaise: 0 },
    { reason: "questions", fromReport: false, events: 2, credits: -2, amountPaise: 0 },
  ],
  countChargedQuestions: async () => 7,
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

test("a refund with a report returns a read credit, a refund without one takes back a purchase", () => {
  expect(kindOf({ reason: "refund", fromReport: true })).toBe("refund");
  expect(kindOf({ reason: "refund", fromReport: false })).toBe("purchase_refund");
  expect(kindOf({ reason: "upload", fromReport: true })).toBe("upload");
});

test("the date filter covers whole UTC days, the to day included", () => {
  expect(ledgerFilter({ from: "2026-10-01", to: "2026-10-14", userId: "u" })).toEqual({
    from: new Date("2026-10-01T00:00:00Z"),
    to: new Date("2026-10-15T00:00:00Z"),
    userId: "u",
  });
  expect(ledgerFilter({})).toEqual({ from: undefined, to: undefined, userId: undefined });
});

test("the credit history totals each kind and keeps report credits apart from question packs", async () => {
  const history = await getCreditHistory({});

  expect(history.reportCredits.totals).toEqual([
    { kind: "grant", events: 1, credits: 5, amountPaise: 0 },
    { kind: "purchase", events: 2, credits: 25, amountPaise: 79800 },
    { kind: "upload", events: 3, credits: -3, amountPaise: 0 },
    { kind: "refund", events: 1, credits: 1, amountPaise: 0 },
    { kind: "purchase_refund", events: 1, credits: -5, amountPaise: 0 },
  ]);
  expect(history.questionPacks.totals).toEqual([
    { kind: "questions", events: 2, credits: -2, amountPaise: 0 },
    { kind: "question", events: 7, credits: 0, amountPaise: 0 },
  ]);
  expect(history.reportCredits.events.map((e) => [e.kind, e.credits, e.amountPaise])).toEqual([
    ["purchase", 5, 19900],
    ["upload", -1, null],
  ]);
  expect(history.questionPacks.events.map((e) => [e.kind, e.credits, e.profiles])).toEqual([
    ["question", null, 2],
    ["questions", -1, 2],
  ]);
});

test("the failed reads carry an error class, never the raw error text", async () => {
  expect(await listFailedReads()).toEqual([
    { id: "r1", createdAt: "2026-10-13T00:00:00.000Z", errorClass: "duplicate" },
  ]);
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
