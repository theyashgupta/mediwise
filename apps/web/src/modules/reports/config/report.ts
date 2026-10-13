import { FlaskConical, type LucideIcon, Pill, RotateCw } from "lucide-react";
import type { FollowUp, ReportDetail } from "../types";

type Tier = NonNullable<ReportDetail["header"]["tier"]>;

export const tierLabels: Record<Tier, string> = {
  apex: "Apex",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

export const chipClass = "gap-1.5 rounded-md bg-card font-normal hover:bg-accent";

export const followUpKinds: Record<FollowUp["kind"], { label: string; icon: LucideIcon }> = {
  retest: { label: "Retest", icon: RotateCw },
  supplement: { label: "Supplement", icon: Pill },
  measure: { label: "Measure", icon: FlaskConical },
};

/**
 * Names the panel by how many core markers it has.
 *
 * @remarks
 * A capped panel is always "Partial", so the name never contradicts the capped-score warning.
 */
export function panelLabel({ pct }: { pct: number | null }, capped: boolean) {
  if (capped) return "Partial panel";
  return (pct ?? 0) >= 75 ? "Comprehensive panel" : "Standard panel";
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
    typeof value === "number" ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : value;
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
    ? new Date(collectedAt).toLocaleDateString("en-IN", { ...options, timeZone: "UTC" })
    : new Date(createdAt).toLocaleDateString("en-IN", options);
}

export function validateReportSearch(search: Record<string, unknown>): { show?: "attention" } {
  return search.show === "attention" ? { show: "attention" } : {};
}
