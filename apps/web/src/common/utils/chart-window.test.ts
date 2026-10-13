import { expect, test } from "vitest";
import { dayTime, defaultChartRange, isRecent, labelledIndexes, timeDomain } from "./chart-window";

const today = new Date(2026, 9, 13);
const weekly = [
  "2026-08-04",
  "2026-08-11",
  "2026-08-18",
  "2026-08-25",
  "2026-09-01",
  "2026-09-08",
  "2026-09-15",
  "2026-09-22",
  "2026-09-29",
  "2026-10-06",
  "2026-10-13",
];

test("a date 90 days before today is recent and a date 91 days before is not", () => {
  expect(isRecent("2026-07-15", today)).toBe(true);
  expect(isRecent("2026-07-14", today)).toBe(false);
});

test("the days of the 12-report fixture open on the last 90 days", () => {
  expect(defaultChartRange(weekly, today)).toBe("recent");
});

test("two recent reports and older ones open on the full range", () => {
  expect(defaultChartRange(["2024-02-10", "2025-02-08", "2026-09-01", "2026-10-06"], today)).toBe(
    "all",
  );
});

test("yearly reports open on the full range", () => {
  expect(defaultChartRange(["2024-02-10", "2025-02-08", "2026-02-14"], today)).toBe("all");
});

test("11 weekly points label every other point and always the latest", () => {
  expect([...labelledIndexes(weekly.map(dayTime))].sort((a, b) => a - b)).toEqual([
    0, 2, 4, 6, 8, 10,
  ]);
});

test("two points a day apart in a year label only the latest of the two", () => {
  const times = ["2025-10-01", "2026-10-05", "2026-10-06"].map(dayTime);
  expect([...labelledIndexes(times)].sort()).toEqual([0, 2]);
});

test("one point gets a time domain of one day on each side", () => {
  const time = dayTime("2026-10-06");
  expect(timeDomain([time])).toEqual([time - 86_400_000, time + 86_400_000]);
});
