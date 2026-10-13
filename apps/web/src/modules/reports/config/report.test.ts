import { expect, test } from "vitest";
import { conditionValue, formatReportDate, panelLabel, validateReportSearch } from "./report";

test("a capped panel is partial, 75% coverage or more is comprehensive, less is standard", () => {
  expect(panelLabel({ pct: 88 }, true)).toBe("Partial panel");
  expect(panelLabel({ pct: 88 }, false)).toBe("Comprehensive panel");
  expect(panelLabel({ pct: 75 }, false)).toBe("Comprehensive panel");
  expect(panelLabel({ pct: 60 }, false)).toBe("Standard panel");
});

test("the collection date wins over the upload date and keeps its day in every time zone", () => {
  expect(formatReportDate("2024-01-13", "2026-10-12T06:43:35.181Z")).toBe("13 Jan 2024");
});

test("only show=attention survives the search params", () => {
  expect(validateReportSearch({ show: "attention" })).toEqual({ show: "attention" });
  expect(validateReportSearch({ show: "everything" })).toEqual({});
  expect(validateReportSearch({})).toEqual({});
});

test("a condition value keeps its unit, and a ratio or a text value prints alone", () => {
  expect(conditionValue(388.9, "pg/mL")).toBe("388.9 pg/mL");
  expect(conditionValue(4.5678, "ratio")).toBe("4.57");
  expect(conditionValue("Reactive", "")).toBe("Reactive");
});
