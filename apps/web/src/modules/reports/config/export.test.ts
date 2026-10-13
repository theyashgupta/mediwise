import { expect, test } from "vitest";
import { birthDateTerm, rangeText, unitText, valueText } from "./export";

test("a range prints both bounds, one open bound in words, or a dash when missing", () => {
  expect(rangeText({ low: 13, high: 17 })).toBe("13 to 17");
  expect(rangeText({ low: null, high: 200 })).toBe("below 200");
  expect(rangeText({ low: 40, high: null })).toBe("above 40");
  expect(rangeText(null)).toBe("-");
});

test("a value prints with the marker precision, and a text result prints as written", () => {
  expect(valueText(5.678, null, 1)).toBe("5.7");
  expect(valueText(null, "Negative")).toBe("Negative");
  expect(valueText(null, null)).toBe("-");
});

test("a ratio or a missing unit prints a dash", () => {
  expect(unitText("mg/dL")).toBe("mg/dL");
  expect(unitText("ratio")).toBe("-");
  expect(unitText(null)).toBe("-");
});

test("an approximate date of birth prints with its label, an exact one prints plain", () => {
  expect(birthDateTerm(true)).toBe("Date of birth (approximate)");
  expect(birthDateTerm(false)).toBe("Date of birth");
});
