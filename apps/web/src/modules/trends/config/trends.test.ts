import { expect, test } from "vitest";
import type { ReportHeader, TrendItem } from "../types";
import { formatChange, reportLabels, sortTrends, sparklinePoints, summaryLine } from "./trends";

const item = (name: string, percent: number | null) =>
  ({ name, change: { absolute: 1, percent } }) as TrendItem;

test("a change prints its sign, unit and percent", () => {
  expect(formatChange({ absolute: -40, percent: -25 }, 0, "mg/dL")).toBe("−40 mg/dL (−25%)");
  expect(formatChange({ absolute: 0.3, percent: null }, 1, "ratio")).toBe("+0.3");
  expect(formatChange({ absolute: 6.2, percent: 15.1 }, 0, "mg/dL")).toBe("+6.2 mg/dL (+15.1%)");
  expect(formatChange({ absolute: 0, percent: 0 }, 0, "mg/dL")).toBe("No change");
});

test("the biggest change sorts first by percent, and a change without a percent sorts last", () => {
  const sorted = sortTrends([item("A", 5), item("B", null), item("C", -30)], "change");
  expect(sorted.map((row) => row.name)).toEqual(["C", "A", "B"]);
  expect(sortTrends([item("b", 1), item("a", 2)], "name").map((row) => row.name)).toEqual([
    "a",
    "b",
  ]);
});

test("a sparkline puts the highest value at the top and a flat series in the middle", () => {
  expect(sparklinePoints([1, 3], 20, 10)).toEqual([
    { x: 2, y: 8 },
    { x: 18, y: 2 },
  ]);
  expect(sparklinePoints([5, 5], 20, 10).map((point) => point.y)).toEqual([5, 5]);
});

test("the summary names a marker that was not retested only when there is one", () => {
  const summary = { improved: 12, worsened: 4, same: 60, new: 3, gone: 0 };
  expect(summaryLine(summary)).toBe("12 improved, 4 worsened, 60 same, 3 new");
  expect(summaryLine({ ...summary, gone: 2 })).toBe(
    "12 improved, 4 worsened, 60 same, 3 new, 2 not retested",
  );
});

test("two reports with one title get the file name, other reports keep their title or date", () => {
  const report = (id: string, collectedAt: string, title: string | null, fileName: string | null) =>
    ({ id, collectedAt, createdAt: `${collectedAt}T08:00:00Z`, title, fileName }) as ReportHeader;
  const labels = reportLabels([
    report("a", "2026-02-10", "10 Feb 2026 · blood panel (20 markers)", "blood.pdf"),
    report("b", "2026-02-10", "10 Feb 2026 · blood panel (20 markers)", "urine.pdf"),
    report("c", "2026-02-10", "10 Feb 2026 · ultrasound", "scan.pdf"),
    report("d", "2025-02-10", null, "old.pdf"),
  ]);
  expect(labels.get("a")).toBe("10 Feb 2026 · blood panel (20 markers), blood.pdf");
  expect(labels.get("b")).toBe("10 Feb 2026 · blood panel (20 markers), urine.pdf");
  expect(labels.get("c")).toBe("10 Feb 2026 · ultrasound");
  expect(labels.get("d")).toBe("10 Feb 2025");
});
