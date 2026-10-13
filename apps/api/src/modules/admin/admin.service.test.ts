import { afterEach, expect, test, vi } from "vitest";
import { alertsFor, errorClass, periodStarts } from "./admin.service.js";

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
