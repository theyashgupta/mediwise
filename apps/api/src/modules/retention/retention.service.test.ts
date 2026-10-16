import { afterEach, beforeEach, expect, test, vi } from "vitest";

type Sweep = (before: Date) => Promise<number>;

const repo = vi.hoisted(() => ({
  deleteFinishedJobs: vi.fn<Sweep>(async () => 2),
  blankJobErrors: vi.fn<Sweep>(async () => 1),
  deleteClearedQuestions: vi.fn<Sweep>(async () => 3),
  deleteDeletionLogRows: vi.fn<Sweep>(async () => 0),
}));

vi.mock("./retention.repo.js", () => repo);

const { sweepIfDue } = await import("./retention.service.js");

const minute = 60 * 1000;

/** Each test sets a later clock than the one before, because the service keeps its next sweep time across tests. */
beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(repo)) fn.mockClear();
});

afterEach(() => vi.useRealTimers());

const cutoff = (fn: { mock: { calls: [Date][] } }) => fn.mock.calls.at(-1)?.[0].toISOString();

test("a sweep deletes jobs after 30 days, blanks job errors after 7 days, questions after 90 days and log rows after 2 years", async () => {
  vi.setSystemTime(new Date("2028-03-01T09:30:00.000Z"));

  await sweepIfDue();

  expect(cutoff(repo.deleteFinishedJobs)).toBe("2028-01-31T09:30:00.000Z");
  expect(cutoff(repo.blankJobErrors)).toBe("2028-02-23T09:30:00.000Z");
  expect(cutoff(repo.deleteClearedQuestions)).toBe("2027-12-02T09:30:00.000Z");
  expect(cutoff(repo.deleteDeletionLogRows)).toBe("2026-03-01T09:30:00.000Z");
});

test("the sweep runs once per hour, not on every worker poll", async () => {
  vi.setSystemTime(new Date("2028-06-01T00:00:00.000Z"));
  await sweepIfDue();
  vi.advanceTimersByTime(59 * minute);
  await sweepIfDue();
  expect(repo.deleteFinishedJobs).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(minute);
  await sweepIfDue();
  expect(repo.deleteFinishedJobs).toHaveBeenCalledTimes(2);
});

test("a failed sweep waits one hour before the next try", async () => {
  vi.setSystemTime(new Date("2028-07-01T00:00:00.000Z"));
  repo.deleteFinishedJobs.mockRejectedValueOnce(new Error("connection lost"));

  await expect(sweepIfDue()).rejects.toThrow("connection lost");
  vi.advanceTimersByTime(30 * minute);
  await sweepIfDue();
  expect(repo.deleteFinishedJobs).toHaveBeenCalledTimes(1);

  vi.advanceTimersByTime(30 * minute);
  await sweepIfDue();
  expect(repo.deleteFinishedJobs).toHaveBeenCalledTimes(2);
  expect(repo.deleteDeletionLogRows).toHaveBeenCalledTimes(1);
});
