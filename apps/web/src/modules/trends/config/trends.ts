import { getT } from "@/common/hooks/use-locale";
import { formatValue } from "@/modules/markers";
import { formatReportDate } from "@/modules/reports";
import type {
  Change,
  Comparison,
  CompareRow,
  Direction,
  ReportHeader,
  TrendItem,
  TrendSort,
} from "../types";

export const directionStyles: Record<Direction, { text: string; badge: string }> = {
  improving: { text: "text-optimal", badge: "bg-optimal-soft text-optimal" },
  worsening: { text: "text-risk", badge: "bg-risk-soft text-risk" },
  stable: { text: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
};

export const verdictStyles: Record<CompareRow["verdictChange"], string> = {
  improved: "bg-optimal-soft text-optimal",
  worsened: "bg-risk-soft text-risk",
  same: "bg-muted text-muted-foreground",
  new: "bg-muted text-foreground",
  gone: "bg-muted text-muted-foreground",
};

/** Returns the unit to print, or nothing for a ratio. */
export function displayUnit(unit: string | null) {
  return unit && unit !== "ratio" ? unit : undefined;
}

/**
 * Formats a change with an explicit sign, the unit and the percent when it is known.
 *
 * @remarks
 * The change keeps at least 2 decimals, so 41.1 to 47.3 reads +6.2 even when the marker shows whole numbers.
 */
export function formatChange(change: Change, precision: number, unit: string | null) {
  const digits = Math.max(precision, 2);
  if (!change || Number(change.absolute.toFixed(digits)) === 0) return getT().markers.noChange;
  const sign = change.absolute > 0 ? "+" : "−";
  const shown = displayUnit(unit);
  const absolute = `${sign}${formatValue(Math.abs(change.absolute), digits)}${shown ? ` ${shown}` : ""}`;
  return change.percent === null
    ? absolute
    : `${absolute} (${sign}${formatValue(Math.abs(change.percent), 1)}%)`;
}

/**
 * Sorts trend rows by name, or by the size of the last change.
 *
 * @remarks
 * The change is compared in percent, so markers in different units rank fairly. A change without a percent sorts last.
 */
export function sortTrends(items: TrendItem[], sort: TrendSort) {
  const byName = (a: TrendItem, b: TrendItem) => a.name.localeCompare(b.name);
  if (sort === "name") return items.toSorted(byName);
  const size = (item: TrendItem) => Math.abs(item.change?.percent ?? -1);
  return items.toSorted((a, b) => size(b) - size(a) || byName(a, b));
}

/**
 * Places values on a sparkline inside a width by height box.
 *
 * @remarks
 * A flat series sits in the middle of the box, so it does not draw on the edge.
 */
export function sparklinePoints(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const y = (value: number) =>
    max === min ? height / 2 : pad + ((max - value) / (max - min)) * (height - pad * 2);
  return values.map((value, i) => ({ x: pad + i * step, y: y(value) }));
}

/** Writes the one-line count of how markers changed between two reports. */
export function summaryLine(summary: Comparison["summary"]) {
  const t = getT().trends.summary;
  const parts = [
    t.improved(summary.improved),
    t.worsened(summary.worsened),
    t.same(summary.same),
    t.new(summary.new),
  ];
  if (summary.gone > 0) parts.push(t.gone(summary.gone));
  return parts.join(", ");
}

export function validateCompareSearch(search: Record<string, unknown>): { a?: string; b?: string } {
  const id = (value: unknown) => (typeof value === "string" && value ? value : undefined);
  return { a: id(search.a), b: id(search.b) };
}

/**
 * Labels each report by its title, or its date when it has none, keyed by report id.
 *
 * @remarks
 * Two reports with one title add the name of their first file, so the picker never shows one text twice.
 */
export function reportLabels(reports: ReportHeader[]) {
  const base = new Map(
    reports.map((report) => [
      report.id,
      report.title ?? formatReportDate(report.collectedAt, report.createdAt),
    ]),
  );
  const counts = new Map<string, number>();
  for (const label of base.values()) counts.set(label, (counts.get(label) ?? 0) + 1);
  return new Map(
    reports.map((report) => {
      const label = base.get(report.id)!;
      return [
        report.id,
        counts.get(label)! > 1 && report.fileName ? `${label}, ${report.fileName}` : label,
      ];
    }),
  );
}
