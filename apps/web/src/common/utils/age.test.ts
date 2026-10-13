import { expect, test } from "vitest";
import { ageOn } from "./age";

test("age turns over on the birthday and not the day before", () => {
  expect(ageOn("1990-06-15", new Date(2026, 5, 14))).toBe(35);
  expect(ageOn("1990-06-15", new Date(2026, 5, 15))).toBe(36);
});

test("a 29 February birthday turns over on 1 March in a common year", () => {
  expect(ageOn("2000-02-29", new Date(2025, 1, 28))).toBe(24);
  expect(ageOn("2000-02-29", new Date(2025, 2, 1))).toBe(25);
});

test("a 29 February birthday turns over on 29 February in a leap year", () => {
  expect(ageOn("2000-02-29", new Date(2028, 1, 28))).toBe(27);
  expect(ageOn("2000-02-29", new Date(2028, 1, 29))).toBe(28);
});

test("a baby born this year is 0", () => {
  expect(ageOn("2026-01-10", new Date(2026, 9, 11))).toBe(0);
});
