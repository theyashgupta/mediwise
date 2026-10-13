import { expect, test } from "vitest";
import { isMeasuredRecently, isStale, staleAfterDays } from "./report-age";

const today = new Date(2026, 9, 13);

test("a yearly report 365 days old is recent", () => {
  expect(isStale("2025-10-13", 371, today)).toBe(false);
});

test("a yearly report 366 days old is stale", () => {
  expect(isStale("2025-10-12", 371, today)).toBe(true);
});

test("a profile with fewer than three reports keeps the 365-day limit", () => {
  expect(staleAfterDays(null)).toBe(365);
});

test("a weekly profile with no report for 91 days is stale", () => {
  expect(isStale("2026-07-14", 7, today)).toBe(true);
});

test("a weekly profile with a report 90 days ago is recent", () => {
  expect(isStale("2026-07-15", 7, today)).toBe(false);
});

test("a monthly profile reads as old after 90 days and a quarterly one after 365 days", () => {
  expect(staleAfterDays(31)).toBe(90);
  expect(staleAfterDays(91)).toBe(365);
});

test("a marker measured 30 days ago is recent for the retest rule and 31 days ago is not", () => {
  expect(isMeasuredRecently("2026-09-13", today)).toBe(true);
  expect(isMeasuredRecently("2026-09-12", today)).toBe(false);
});
