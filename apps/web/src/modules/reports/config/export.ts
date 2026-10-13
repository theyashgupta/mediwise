import { getIntlTag, getT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { formatRange } from "@/common/utils/range-scale";
import type { Profile } from "@/modules/profiles";
import type { Comparison } from "@/modules/trends";
import type { ExportDetail, MarkerRow } from "../types";

export const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

/** Writes a stored range as text for the export table, or a dash when the lab printed none. */
export function rangeText(range: MarkerRow["labRange"]) {
  return range ? formatRange({ low: range.low ?? undefined, high: range.high ?? undefined }) : "-";
}

/** Writes the value cell, so a text result such as "Negative" prints as the lab wrote it. */
export function valueText(value: number | null, text: string | null, precision = 3) {
  return value === null
    ? (text ?? "-")
    : value.toLocaleString(getIntlTag(), { maximumFractionDigits: precision });
}

/** Names the date of birth row, so a doctor sees when the date came from a printed age. */
export function birthDateTerm(approximate: boolean | undefined) {
  const t = getT().reports.export;
  return approximate ? t.dateOfBirthApproximate : t.dateOfBirth;
}

/** Lists the profile rows the signed-in export prints above the lab details. */
export function profileDetails(profile: Profile | undefined): ExportDetail[] {
  const t = getT();
  return [
    [t.reports.export.name, profile?.name],
    [
      birthDateTerm(profile?.dateOfBirthApproximate),
      profile?.dateOfBirth ? formatPlainDate(profile.dateOfBirth, dateOptions) : null,
    ],
    [t.reports.export.sex, profile?.sex ? t.profiles.sex[profile.sex] : null],
  ];
}

/**
 * Lists the person rows of a shared export: first name and age only.
 *
 * @remarks
 * A share link can be passed on, so the page never shows the full name or the date of birth.
 */
export function sharedPersonDetails(person: {
  firstName: string;
  age: number | null;
}): ExportDetail[] {
  const t = getT().reports.export;
  return [
    [t.firstName, person.firstName],
    [t.age, person.age === null ? null : t.years(person.age)],
  ];
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
  const t = getT().reports.export;
  if (delta > 0) return { symbol: "↑", label: t.higher };
  if (delta < 0) return { symbol: "↓", label: t.lower };
  return undefined;
}
