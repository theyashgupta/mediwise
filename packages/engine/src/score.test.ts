import { expect, test } from "vitest";
import { sameScoreScale } from "./score.js";

test("two full panels share one score scale", () => {
  expect(sameScoreScale(81, 100)).toBe(true);
});

test("a glucose-only report and a full panel do not share a score scale", () => {
  expect(sameScoreScale(6, 88)).toBe(false);
});

test("a panel with a third of the core markers does not share a scale with a full panel", () => {
  expect(sameScoreScale(31, 88)).toBe(false);
});
