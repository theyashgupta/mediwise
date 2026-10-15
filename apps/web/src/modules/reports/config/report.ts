import { FlaskConical, type LucideIcon, Pill, RotateCw } from "lucide-react";
import { getIntlTag, getT } from "@/common/hooks/use-locale";
import type { Status } from "@/common/utils/status";
import type { FollowUp, MarkerFilter } from "../types";

export const chipClass =
  "h-auto min-h-5 max-w-full flex-wrap justify-start gap-x-1.5 rounded-md bg-card font-normal whitespace-normal hover:bg-accent";

export const followUpIcons: Record<FollowUp["kind"], LucideIcon> = {
  retest: RotateCw,
  supplement: Pill,
  measure: FlaskConical,
};

/**
 * Names the panel by how many core markers it has.
 *
 * @remarks
 * A capped panel is always "Partial", so the name never contradicts the capped-score warning.
 */
export function panelLabel({ pct }: { pct: number | null }, capped: boolean) {
  const { panels } = getT().report.summary;
  if (capped) return panels.partial;
  return (pct ?? 0) >= 75 ? panels.comprehensive : panels.standard;
}

/** Returns the typed `Link` options for one marker page of a report. */
export function markerLink(reportId: string, markerKey: string) {
  return { to: "/reports/$reportId/markers/$markerKey", params: { reportId, markerKey } } as const;
}

/** Returns the typed `Link` options for the Studies section of a report page. */
export function studiesLink(reportId: string) {
  return { to: "/reports/$reportId", params: { reportId }, hash: "studies" } as const;
}

/** Writes a matched pattern condition's value with its unit, for a chip. */
export function conditionValue(value: number | string, unit: string) {
  const text =
    typeof value === "number"
      ? value.toLocaleString(getIntlTag(), { maximumFractionDigits: 2 })
      : value;
  return unit && unit !== "ratio" ? `${text} ${unit}` : text;
}

/**
 * Formats the collection date, or the upload date when the lab date is not known.
 *
 * @remarks
 * `collectedAt` is a plain date, so it is read in UTC to keep the day from shifting.
 */
export function formatReportDate(collectedAt: string | null, createdAt: string) {
  const options = { day: "numeric", month: "short", year: "numeric" } as const;
  return collectedAt
    ? new Date(collectedAt).toLocaleDateString(getIntlTag(), { ...options, timeZone: "UTC" })
    : new Date(createdAt).toLocaleDateString(getIntlTag(), options);
}

export const markerFilters = ["all", "risk", "watch", "optimal"] as const satisfies MarkerFilter[];

export function validateReportSearch(search: Record<string, unknown>): {
  show?: Exclude<MarkerFilter, "all">;
} {
  const { show } = search;
  return show === "risk" || show === "watch" || show === "optimal" ? { show } : {};
}

const statusOrder: Status[] = ["risk", "watch", "optimal", "unknown"];

/** Counts the items of each status, worst first, and leaves out a status with no item. */
export function statusCounts(items: { status: Status }[]) {
  return statusOrder
    .map((status) => ({ status, count: items.filter((item) => item.status === status).length }))
    .filter(({ count }) => count > 0);
}
