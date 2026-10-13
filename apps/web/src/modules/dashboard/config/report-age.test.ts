import { expect, test } from "vitest";
import { isOlderThanAYear } from "./report-age";

const today = new Date(2026, 9, 13);

test("a report 364 days old is recent", () => {
  expect(isOlderThanAYear("2025-10-14", today)).toBe(false);
});

test("a report 365 days old is recent", () => {
  expect(isOlderThanAYear("2025-10-13", today)).toBe(false);
});

test("a report 366 days old is older than a year", () => {
  expect(isOlderThanAYear("2025-10-12", today)).toBe(true);
});
