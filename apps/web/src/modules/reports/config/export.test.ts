import { expect, test } from "vitest";
import {
  birthDateTerm,
  changeMark,
  earlierSource,
  profileDetails,
  rangeText,
  sharedPersonDetails,
  unitText,
  valueText,
} from "./export";

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

test("earlier values from one report name that report, values from two reports name none", () => {
  const value = (markerKey: string, reportId: string) => ({
    markerKey,
    value: 1,
    reportId,
    labName: "Made-up Labs",
    collectedAt: "2025-02-01",
    createdAt: "2025-02-03T09:00:00Z",
  });
  expect(earlierSource([value("ldl", "a"), value("hdl", "a")])?.reportId).toBe("a");
  expect(earlierSource([value("ldl", "a"), value("hba1c", "b")])).toBeUndefined();
  expect(earlierSource([])).toBeUndefined();
});

test("the change mark compares the printed values, and a text result has no mark", () => {
  expect(changeMark(5.4, 5.6, 1)?.label).toBe("Higher now");
  expect(changeMark(140, 120, 0)?.label).toBe("Lower now");
  expect(changeMark(5.44, 5.41, 1)).toBeUndefined();
});

test("a shared export lists only the first name and the age", () => {
  expect(sharedPersonDetails({ firstName: "Asha", age: 49 })).toEqual([
    ["First name", "Asha"],
    ["Age", "49 years"],
  ]);
  expect(sharedPersonDetails({ firstName: "Asha", age: null })[1]).toEqual(["Age", null]);
});

test("the signed-in export lists the full name, the date of birth and the sex", () => {
  expect(
    profileDetails({
      id: "profile-1",
      name: "Asha Rao",
      relation: "parent",
      dateOfBirth: "1977-02-28",
      dateOfBirthApproximate: true,
      sex: "female",
      ancestry: "south_asian",
      isSelf: false,
      permissionConfirmedAt: null,
      guardianConfirmedAt: null,
      reportCount: 1,
      valueCount: 0,
    }),
  ).toEqual([
    ["Name", "Asha Rao"],
    ["Date of birth (approximate)", "28 Feb 1977"],
    ["Sex", "Female"],
  ]);
});
