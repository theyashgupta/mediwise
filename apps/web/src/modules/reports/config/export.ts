import { formatRange } from "@/common/utils/range-scale";
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

/** Returns the unit to print, or a dash for a ratio or a missing unit. */
export function unitText(unit: string | null) {
  return unit && unit !== "ratio" ? unit : "-";
}
