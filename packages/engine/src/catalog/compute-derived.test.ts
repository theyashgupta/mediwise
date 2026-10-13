import { expect, test } from "vitest";
import { computeDerived, derived, type Derived } from "./index.js";

function entry(key: string): Derived {
  const found = derived.find((item) => item.key === key);
  if (!found) throw new Error(`no derived marker ${key}`);
  return found;
}

test("eGFR follows CKD-EPI 2021 for a man and a woman", () => {
  const egfr = entry("egfr");
  expect(computeDerived(egfr, { creatinine: 1.0 }, { age: 50, sex: "male" })).toBeCloseTo(91.7, 1);
  expect(computeDerived(egfr, { creatinine: 0.8 }, { age: 60, sex: "female" })).toBeCloseTo(
    84.3,
    1,
  );
});

test("eGFR is not computed for a child or without a profile", () => {
  const egfr = entry("egfr");
  expect(computeDerived(egfr, { creatinine: 0.5 }, { age: 10, sex: "male" })).toBeUndefined();
  expect(computeDerived(egfr, { creatinine: 1.0 })).toBeUndefined();
});

test("ratios, differences, linear and HOMA-IR formulas compute from canonical values", () => {
  expect(computeDerived(entry("transferrin_saturation"), { iron: 100, tibc: 400 })).toBe(25);
  expect(
    computeDerived(entry("non_hdl_cholesterol"), { total_cholesterol: 200, hdl_cholesterol: 45 }),
  ).toBe(155);
  expect(computeDerived(entry("estimated_average_glucose"), { hba1c: 5.7 })).toBeCloseTo(116.9, 1);
  expect(
    computeDerived(entry("homa_ir"), { glucose_fasting: 90, insulin_fasting: 10 }),
  ).toBeCloseTo(2.22, 2);
});

test("a missing input or a zero denominator returns undefined", () => {
  expect(computeDerived(entry("tc_hdl_ratio"), { total_cholesterol: 180 })).toBeUndefined();
  expect(
    computeDerived(entry("tc_hdl_ratio"), { total_cholesterol: 180, hdl_cholesterol: 0 }),
  ).toBeUndefined();
});
