import { formatRange } from "@/common/utils/range-scale";
import type { Comparison } from "@/modules/trends";
import type { MarkerRow } from "../types";

/** Writes a stored range as text for the export table, or a dash when the lab printed none. */
export function rangeText(range: MarkerRow["labRange"]) {
  return range ? formatRange({ low: range.low ?? undefined, high: range.high ?? undefined }) : "-";
}

/** Writes the value cell, so a text result such as "Negative" prints as the lab wrote it. */
export function valueText(value: number | null, text: string | null, precision = 3) {
  return value === null
    ? (text ?? "-")
    : value.toLocaleString("en-IN", { maximumFractionDigits: precision });
}

/** Names the date of birth row, so a doctor sees when the date came from a printed age. */
export function birthDateTerm(approximate: boolean | undefined) {
  return approximate ? "Date of birth (approximate)" : "Date of birth";
}

/** Returns the unit to print, or a dash for a ratio or a missing unit. */
export function unitText(unit: string | null) {
  return unit && unit !== "ratio" ? unit : "-";
}

type DatedReport = { collectedAt: string | null; createdAt: string };

const visitDate = (report: DatedReport) => report.collectedAt ?? report.createdAt.slice(0, 10);

/**
 * Finds the profile's report before this one in a list of done reports, oldest first.
 *
 * @remarks
 * Same rule as the dashboard score change: a report from the same collection date is the same visit, so it is skipped.
 */
export function previousReport<T extends DatedReport>(reports: T[], current: DatedReport) {
  return reports.filter((report) => visitDate(report) < visitDate(current)).at(-1);
}

/** Keeps the previous value of each marker the previous report measured in this report's unit. */
export function previousValues(groups: Comparison["groups"]) {
  return new Map(
    groups.flatMap(({ rows }) =>
      rows.flatMap((row) =>
        row.statusA !== null && row.valueA !== null ? [[row.markerKey, row.valueA] as const] : [],
      ),
    ),
  );
}

/**
 * Gives the mark for the change from the previous value to this one, or nothing when they print the same.
 *
 * @remarks
 * Both values are rounded to the printed precision first, so the mark never disagrees with the two numbers on the page.
 */
export function changeMark(previous: number, current: number, precision: number) {
  const delta = Number(current.toFixed(precision)) - Number(previous.toFixed(precision));
  if (delta > 0) return { symbol: "↑", label: "Higher now" };
  if (delta < 0) return { symbol: "↓", label: "Lower now" };
  return undefined;
}
