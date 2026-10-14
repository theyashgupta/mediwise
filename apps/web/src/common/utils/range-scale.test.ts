import { expect, test } from "vitest";
import { formatBounds, formatRange, rangeScale } from "./range-scale";

test("a value inside a closed range sits inside both bands", () => {
  const { value, lab, calibrated } = rangeScale(85, { low: 70, high: 100 }, { low: 75, high: 90 });
  expect(lab?.from).toBeLessThan(calibrated?.from ?? 0);
  expect(calibrated?.from).toBeLessThan(value);
  expect(value).toBeLessThan(calibrated?.to ?? 0);
  expect(calibrated?.to).toBeLessThan(lab?.to ?? 0);
});

test("a range with only a high bound starts at the left edge", () => {
  const { value, lab } = rangeScale(160, { high: 200 });
  expect(lab?.from).toBe(0);
  expect(value).toBeLessThan(lab?.to ?? 0);
});

test("a range with only a low bound runs to the right edge", () => {
  expect(rangeScale(30, { low: 40 }).lab?.to).toBe(100);
});

test("a value far outside the range stays on the bar", () => {
  const { value, lab } = rangeScale(900, { low: 70, high: 100 });
  expect(value).toBeGreaterThan(lab?.to ?? 100);
  expect(value).toBeLessThanOrEqual(100);
});

test("a value with no ranges gets a finite position and no bands", () => {
  const scale = rangeScale(0);
  expect(Number.isFinite(scale.value)).toBe(true);
  expect(scale.lab).toBeNull();
  expect(scale.calibrated).toBeNull();
});

test("a watch band wraps the calibrated band and widens the domain", () => {
  const { calibrated, watch } = rangeScale(140, undefined, { high: 99 }, { high: 129 });
  expect(watch?.from).toBe(0);
  expect(calibrated?.to).toBeLessThan(watch?.to ?? 0);
});

test("an open range reads as below or above its one bound", () => {
  expect(formatRange({ high: 100 }, "mg/dL")).toBe("below 100 mg/dL");
  expect(formatRange({ low: 30 })).toBe("above 30");
  expect(formatRange({ low: 13, high: 17 }, "g/dL")).toBe("13 to 17 g/dL");
});

test("formatBounds writes a stored range with its unit, and the empty text for no bound", () => {
  expect(formatBounds({ low: null, high: 130 }, "mg/dL", "None")).toBe("below 130 mg/dL");
  expect(formatBounds({ low: 4, high: 5.6 }, "%", "None")).toBe("4 to 5.6 %");
  expect(formatBounds({ low: null, high: null }, "%", "None")).toBe("None");
  expect(formatBounds(null, "%", "None")).toBe("None");
});
