import { describe, expect, test } from "vitest";
import { findMarker } from "./catalog/index.js";
import { normaliseValues, toCanonical } from "./normalise.js";

const glucose = findMarker("glucose fasting")!;
const ratio = findMarker("tg hdl ratio")!;

describe("toCanonical", () => {
  test("a canonical unit in any spelling keeps the value", () => {
    expect(toCanonical(glucose, 92, "mg/dl")).toBe(92);
    expect(toCanonical(findMarker("haemoglobin")!, 14.2, "gm/dL")).toBe(14.2);
  });

  test("K/uL and M/uL count as thousands and millions per microlitre", () => {
    expect(toCanonical(findMarker("wbc count")!, 6.2, "K/ul")).toBe(6.2);
    expect(toCanonical(findMarker("platelet count")!, 250, "K/uL")).toBe(250);
    expect(toCanonical(findMarker("rbc count")!, 4.9, "M/ul")).toBe(4.9);
  });

  test("a squared unit written with a caret matches the superscript spelling", () => {
    expect(toCanonical(findMarker("egfr")!, 98, "ml/min/1.73m^2")).toBe(98);
  });

  test("a listed unit converts to canonical and rounds to the marker precision", () => {
    expect(toCanonical(glucose, 5.2, "mmol/L")).toBe(94);
  });

  test("an unknown unit gives no value", () => {
    expect(toCanonical(glucose, 92, "furlongs")).toBeUndefined();
  });

  test("a missing unit is canonical only for a unitless marker", () => {
    expect(toCanonical(glucose, 92)).toBeUndefined();
    expect(toCanonical(ratio, 2.4)).toBe(2.4);
  });
});

describe("normaliseValues", () => {
  test("a name the catalog does not know is unmapped", () => {
    const { normalised, unmapped } = normaliseValues([{ rawName: "Mystery factor", value: 3 }]);
    expect(normalised).toEqual([]);
    expect(unmapped).toEqual([{ rawName: "Mystery factor", value: 3, unit: "" }]);
  });

  test("the first value for a marker wins", () => {
    const { normalised } = normaliseValues([
      { rawName: "FBS", value: 92, unit: "mg/dL" },
      { rawName: "Glucose Fasting", value: 120, unit: "mg/dL" },
    ]);
    expect(normalised.map((item) => item.value)).toEqual([92]);
  });

  test("lab range bounds convert with the value", () => {
    const { normalised } = normaliseValues([
      { rawName: "FBS", value: 5.2, unit: "mmol/L", labLow: 3.9, labHigh: 5.5 },
    ]);
    expect(normalised[0]?.labRange).toEqual({ low: 70, high: 99 });
  });
});

describe("misprinted units", () => {
  test("mg/Lt reads as mg/L", () => {
    expect(toCanonical(findMarker("hs crp")!, 0.78, "mg/Lt")).toBe(0.78);
  });

  test("a repeat in a unit the catalog converts replaces a first value it cannot convert", () => {
    const { normalised } = normaliseValues([
      { rawName: "TSH", value: 9.98, unit: "mIU/ml" },
      { rawName: "Glucose fasting", value: 92, unit: "mg/dL" },
      { rawName: "TSH", value: 9.98, unit: "uIU/mL" },
    ]);
    expect(normalised.map(({ entry, unit, canonical }) => [entry.key, unit, canonical])).toEqual([
      ["tsh", "µIU/mL", true],
      ["glucose_fasting", "mg/dL", true],
    ]);
  });

  test("a later repeat never replaces a first value that converts", () => {
    const { normalised } = normaliseValues([
      { rawName: "TSH", value: 5.41, unit: "µIU/mL" },
      { rawName: "TSH", value: 6, unit: "mIU/L" },
    ]);
    expect(normalised.map(({ value }) => value)).toEqual([5.41]);
  });
});
