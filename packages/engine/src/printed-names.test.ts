import { expect, test } from "vitest";
import { findMarker } from "./catalog/index.js";
import { isPopulationRow, joinWrappedNames } from "./printed-names.js";

test.each([
  "Cord blood",
  "1 to 4 days",
  "4 to 30 days",
  "1 to 12 months",
  "6 to 10 years",
  "First Trimester",
  "Adults (20-60 yrs)",
  "Male",
  "> 60 years",
])("the reference table row %j is a population group", (name) => {
  expect(isPopulationRow(name)).toBe(true);
});

test.each(["TSH", "Pregnancy Test", "Vitamin B12", "Cholesterol Total", "Male Hormone Panel"])(
  "the test name %j is not a population group",
  (name) => {
    expect(isPopulationRow(name)).toBe(false);
  },
);

const labBPage = [
  "  Test Name                          Result     Unit      Bio.Ref.Range",
  "  HIGH SENSITIVITY C-REACTIVE        0.78       mg/Lt     0.1-10 mg/l",
  "  PROTEIN (HS-CRP)                                        < 1 mg/L = Low risk for CVD",
  "   SANDWICH IMMUNODETECTION METHOD",
  "  TSH (Thyroid Stimulating Hormone)  9.980      mIU/ml    0.3-4.5",
  "   CLIA",
  "  Triglycerides                      58.1       mg/dL     < 150",
].join("\n");

test("a name printed over two lines joins and maps as hs-CRP, not CRP", () => {
  const [marker] = joinWrappedNames([{ rawName: "HIGH SENSITIVITY C-REACTIVE" }], [labBPage]);
  expect(marker?.rawName).toBe("HIGH SENSITIVITY C-REACTIVE PROTEIN (HS-CRP)");
  expect(findMarker(marker?.rawName ?? "")?.key).toBe("hs_crp");
});

test("a method line or the next test never joins to a name", () => {
  const markers = [{ rawName: "TSH (Thyroid Stimulating Hormone)" }, { rawName: "Triglycerides" }];
  expect(joinWrappedNames(markers, [labBPage])).toEqual(markers);
});

test("a name the lab printed on one line stays as it is", () => {
  const marker = { rawName: "HIGH SENSITIVITY C-REACTIVE PROTEIN (HS-CRP)" };
  expect(joinWrappedNames([marker], [labBPage])).toEqual([marker]);
});
