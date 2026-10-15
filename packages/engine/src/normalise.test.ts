import { describe, expect, test } from "vitest";
import { findMarker, markers } from "./catalog/index.js";
import { normaliseUnit, normaliseValues, toCanonical } from "./normalise.js";

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

describe("international units", () => {
  test.each([
    ["Glucose fasting", 5.5, "mmol/L", 99, 0],
    ["Glucose fasting", 0.99, "g/L", 99, 0],
    ["Total cholesterol", 5.2, "mmol/L", 201, 0],
    ["Total cholesterol", 2.01, "g/L", 201, 0],
    ["Triglycerides", 1.5, "g/L", 150, 0],
    ["Creatinine", 88.4, "umol/L", 1, 1],
    ["Creatinine", 10, "mg/L", 1, 1],
    ["BUN", 5, "mmol/L", 14, 0],
    ["Urea", 5, "mmol/L", 30, 0],
    ["Urea", 0.3, "g/L", 30, 0],
    ["Uric acid", 357, "µmol/L", 6, 1],
    ["Uric acid", 0.36, "mmol/L", 6, 1],
    ["Uric acid", 60, "mg/L", 6, 1],
    ["Bilirubin", 17.1, "umol/L", 1, 1],
    ["Bilirubin", 10, "mg/L", 1, 1],
    ["Calcium", 2.5, "mmol/L", 10, 1],
    ["Calcium", 100, "mg/L", 10, 1],
    ["Haemoglobin", 140, "g/L", 14, 1],
    ["Haemoglobin", 8.7, "mmol/L", 14, 1],
    ["TSH", 2.1, "mU/L", 2.1, 1],
    ["TSH", 2.1, "mIU/L", 2.1, 1],
    ["Free T4", 15, "pmol/L", 1.16, 1],
    ["Vitamin D", 75, "nmol/L", 30, 0],
    ["Vitamin B12", 300, "ng/L", 300, 0],
    ["Vitamin B12", 300, "pmol/L", 407, 0],
    ["Ferritin", 80, "ug/L", 80, 0],
    ["ALT", 0.5, "ukat/L", 30, 0],
    ["Iron", 18, "umol/L", 101, 0],
    ["HbA1c", 48, "mmol/mol", 6.5, 1],
    ["HbA1c", 53, "mmol/mol", 7, 1],
    ["HbA1c", 5.9, "% of total Hgb", 5.9, 1],
  ] as const)(
    "%s %d %s converts to %d in the canonical unit",
    (name, value, unit, expected, digits) => {
      expect(toCanonical(findMarker(name)!, value, unit)).toBeCloseTo(expected, digits);
    },
  );

  test("HbA1c converts only from mmol/mol and percent, never with a glucose factor", () => {
    const hba1c = findMarker("HbA1c")!;
    expect(hba1c.conversions.map((c) => c.from)).toEqual(["mmol/mol", "% of total Hgb"]);
    expect(toCanonical(hba1c, 48, "mmol/L")).toBeUndefined();
    expect(toCanonical(hba1c, 48, "mg/dL")).toBeUndefined();
  });

  test("an ambiguous unit stays unconverted", () => {
    expect(toCanonical(findMarker("Vitamin D")!, 50, "IU")).toBeUndefined();
    expect(toCanonical(findMarker("Creatinine")!, 1, "mmol/mol")).toBeUndefined();
  });

  test("no unit converts two ways on one marker", () => {
    for (const marker of markers) {
      const rules = new Map([[normaliseUnit(marker.unit), "1+0"]]);
      for (const { from, factor, offset } of marker.conversions) {
        const rule = `${factor}+${offset ?? 0}`;
        expect(rules.get(normaliseUnit(from)) ?? rule, `${marker.key} ${from}`).toBe(rule);
        rules.set(normaliseUnit(from), rule);
      }
    }
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
