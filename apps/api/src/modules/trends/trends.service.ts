import {
  categories,
  categoryLabel,
  daysBetween,
  derived,
  type Marker,
  markers,
  repeatsMarker,
  studyMarkers,
  type TextLocale,
  toCanonical,
  trendDirection,
  typicalGapDays,
} from "@mediwise/engine";
import { AppError } from "../../common/errors.js";
import { listLinkedPairs } from "../links/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import type { CompareQuery } from "./trends.schemas.js";
import * as repo from "./trends.repo.js";

type StoredReport = Awaited<ReturnType<typeof repo.listDoneReports>>[number];
type StoredRow = Awaited<ReturnType<typeof repo.listMarkerRows>>[number];
type Status = NonNullable<StoredRow["status"]> | "unknown";

const catalog = new Map(
  [...markers, ...derived, ...studyMarkers].map((entry, order) => [entry.key, { entry, order }]),
);
const statusRank: Record<Status, number> = { optimal: 0, watch: 1, risk: 2, unknown: -1 };

/**
 * Ranks the duplicate rows of one marker in one report so the row the engine scored comes first.
 *
 * @remarks
 * Same rule as the report page, so a trend point always matches the value the report shows.
 */
function preference(row: StoredRow) {
  if (row.status) return 0;
  return row.value === null ? 2 : 1;
}

const byCatalogOrder = (a: string, b: string) =>
  (catalog.get(a)?.order ?? 0) - (catalog.get(b)?.order ?? 0);

/** Keeps one row per report and catalog marker. */
function pickRows(rows: StoredRow[]) {
  const picked = new Map<string, Map<string, StoredRow>>();
  for (const row of rows) {
    if (!row.markerKey || !catalog.has(row.markerKey)) continue;
    const report = picked.get(row.reportId) ?? new Map<string, StoredRow>();
    picked.set(row.reportId, report);
    const kept = report.get(row.markerKey);
    if (!kept || preference(row) < preference(kept)) report.set(row.markerKey, row);
  }
  return picked;
}

/**
 * Computes the change from one stored value to the next.
 *
 * @remarks
 * Rounding to 4 places only removes float noise, so 41.1 to 47.3 stays +6.2 for a marker shown with no decimals.
 */
export function computeChange(previous: number, latest: number) {
  const delta = latest - previous;
  return {
    absolute: Number(delta.toFixed(4)),
    percent: previous === 0 ? null : Number(((delta / Math.abs(previous)) * 100).toFixed(1)),
  };
}

/**
 * Compares two statuses of one marker.
 *
 * @remarks
 * A status the engine did not give cannot be ranked, so it counts as the same.
 */
export function verdictChange(
  a: Status | null,
  b: Status | null,
): "improved" | "worsened" | "same" | "new" | "gone" {
  if (a === null) return "new";
  if (b === null) return "gone";
  if (a === "unknown" || b === "unknown" || a === b) return "same";
  return statusRank[b] < statusRank[a] ? "improved" : "worsened";
}

function statusOf(row: StoredRow): Status {
  return row.status ?? "unknown";
}

/**
 * Writes a stored value in another row's unit, so the two values of a compared marker share one unit.
 *
 * @remarks
 * The engine converts only to the catalog unit. A value it cannot convert returns null, never a number in the wrong unit.
 */
function valueInUnit(entry: Marker, row: StoredRow, unit: string | null) {
  if (row.value === null) return row.valueText;
  if (row.unit === unit) return row.value;
  return unit === entry.unit
    ? (toCanonical(entry, row.value, row.unit ?? undefined) ?? null)
    : null;
}

function toRange(low: number | null, high: number | null) {
  return low === null && high === null ? null : { low, high };
}

/** Normalises a printed lab name, so case and spacing alone never read as another lab. */
function labKey(name: string | null) {
  return name?.trim().toLowerCase().replace(/\s+/g, " ") || null;
}

/**
 * Marks each point whose lab differs from the last named lab before it.
 *
 * @remarks
 * A report without a lab name could come from either lab, so it never marks a change and never resets the comparison.
 */
function labChanges(labNames: (string | null)[]) {
  let last: string | null = null;
  return labNames.map((name) => {
    const key = labKey(name);
    const changed = last !== null && key !== null && key !== last;
    last = key ?? last;
    return changed;
  });
}

/** The day a report belongs to: its collection date, or its upload day when the lab printed none. */
export function visitDate(report: Pick<StoredReport, "collectedAt" | "createdAt">) {
  return report.collectedAt ?? report.createdAt.toISOString().slice(0, 10);
}

/**
 * Builds one marker's numeric series across visits, oldest first.
 *
 * @remarks
 * Reports of one collection date are one visit, and the newest report's value wins that date. The other values of
 * that date ride along in `sameDay`, so the chart draws one point per day and the tooltip still shows each value.
 * Only points in the unit of the latest point are kept, so a series never mixes units.
 * A point is linked when it and the point next to it come from linked reports or the next one repeats it by `repeatsMarker`.
 */
function toSeries(
  entry: Marker,
  ordered: StoredReport[],
  picked: Map<string, Map<string, StoredRow>>,
  pairs: Set<string>,
) {
  const typicalGap = typicalGapDays(ordered.map(visitDate));
  type Found = { report: StoredReport; row: StoredRow; value: number };
  const byDate = new Map<string, Found[]>();
  for (const report of ordered) {
    const row = picked.get(report.id)?.get(entry.key);
    if (!row || row.value === null) continue;
    const date = visitDate(report);
    byDate.set(date, [...(byDate.get(date) ?? []), { report, row, value: row.value }]);
  }
  const unit = [...byDate.values()].at(-1)?.at(-1)?.row.unit ?? null;
  const days = [...byDate.values()].flatMap((found) => {
    const inUnit = found.filter(({ row }) => row.unit === unit);
    const kept = inUnit.at(-1);
    return kept ? [{ ...kept, sameDay: inUnit.slice(0, -1) }] : [];
  });
  const last = days.at(-1);
  const previous = days.at(-2);
  const change = last && previous ? computeChange(previous.value, last.value) : null;
  const labChange = labChanges(days.map(({ report }) => report.labName));
  const joined = days.map(({ report, row }, index) => {
    const next = days[index + 1]?.report;
    return (
      next !== undefined &&
      (pairs.has(`${report.id}:${next.id}`) ||
        repeatsMarker(daysBetween(visitDate(report), visitDate(next)), row.status, typicalGap))
    );
  });
  const optimal = { low: last?.row.calibratedLow ?? null, high: last?.row.calibratedHigh ?? null };
  return {
    markerKey: entry.key,
    name: entry.name,
    shortName: entry.shortName ?? null,
    category: entry.category,
    unit,
    precision: entry.precision,
    points: days.map(({ report, row, value, sameDay }, index) => ({
      reportId: report.id,
      labName: report.labName,
      labChange: labChange[index] ?? false,
      labRange: toRange(row.labRangeLow, row.labRangeHigh),
      calibratedRange: toRange(row.calibratedLow, row.calibratedHigh),
      collectedAt: report.collectedAt,
      createdAt: report.createdAt,
      value,
      status: statusOf(row),
      sameDay: sameDay.map((other) => ({
        reportId: other.report.id,
        labName: other.report.labName,
        value: other.value,
        status: statusOf(other.row),
      })),
      linked: joined[index] === true || joined[index - 1] === true,
      episode: report.episodeName ?? null,
    })),
    labCount: new Set(days.map(({ report }) => labKey(report.labName)).filter(Boolean)).size,
    latestStatus: last ? statusOf(last.row) : "unknown",
    change,
    direction:
      last && previous
        ? trendDirection(entry.direction, previous.value, last.value, entry.precision, optimal)
        : "stable",
    calibratedRange: toRange(optimal.low, optimal.high),
  };
}

/** Loads a profile's done reports, oldest first, and one series for each catalog marker they measure. */
export async function listSeries(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  const [ordered, rows, pairs] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId),
    listLinkedPairs(profileId),
  ]);
  const picked = pickRows(rows);
  const linked = new Set(pairs);
  const keys = new Set([...picked.values()].flatMap((report) => [...report.keys()]));
  const series = [...keys].sort(byCatalogOrder).flatMap((key) => {
    const entry = catalog.get(key)?.entry;
    return entry ? [toSeries(entry, ordered, picked, linked)] : [];
  });
  return { reports: ordered, series };
}

/** Lists every marker of a profile measured in at least two done reports, in catalog order. */
export async function listTrends(userId: string, profileId: string, locale: TextLocale = "en") {
  const { reports, series: all } = await listSeries(userId, profileId);
  const series = all.filter((item) => item.points.length >= 2);
  const present = new Set(series.map((item) => item.category));
  return {
    reportCount: reports.length,
    categories: categories
      .filter(({ key }) => present.has(key))
      .map(({ key }) => ({ key, label: categoryLabel(key, locale) })),
    markers: series,
  };
}

/** Loads every point of one marker for a profile, with the latest calibrated range. */
export async function getTrend(userId: string, profileId: string, markerKey: string) {
  const known = catalog.get(markerKey);
  const notFound = new AppError(404, "This profile has no value for this marker");
  if (!known) throw notFound;
  await getOwnedProfile(userId, profileId);
  const [ordered, rows, pairs] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId, markerKey),
    listLinkedPairs(profileId),
  ]);
  const series = toSeries(known.entry, ordered, pickRows(rows), new Set(pairs));
  if (series.points.length === 0) throw notFound;
  return series;
}

/**
 * Finds each marker's newest value from a date before this report, in this report's unit.
 *
 * @remarks
 * Each marker looks back on its own, so a glucose-only report in between never hides the full panel before it.
 * A report of the same collection date is the same visit, so it never gives an earlier value.
 */
export async function listEarlierValues(userId: string, reportId: string) {
  const notFound = new AppError(404, "We could not find this report");
  const profileId = await repo.findReportProfileId(userId, reportId);
  if (!profileId) throw notFound;
  const [ordered, rows] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId),
  ]);
  const current = ordered.find((report) => report.id === reportId);
  if (!current) throw notFound;
  const picked = pickRows(rows);
  const earlier = ordered.filter((report) => visitDate(report) < visitDate(current)).reverse();
  return [...(picked.get(reportId) ?? [])].flatMap(([markerKey, row]) => {
    const entry = catalog.get(markerKey)!.entry;
    for (const report of earlier) {
      const found = picked.get(report.id)?.get(markerKey);
      const value = found ? valueInUnit(entry, found, row.unit) : null;
      if (value !== null) {
        const { id, labName, collectedAt, createdAt } = report;
        return [{ markerKey, value, reportId: id, labName, collectedAt, createdAt }];
      }
    }
    return [];
  });
}

function toHeader(report: StoredReport) {
  const { id, labName, collectedAt, createdAt, score, tier } = report;
  return { id, labName, collectedAt, createdAt, score, tier };
}

/**
 * Compares two done reports of one profile, marker by marker, older report first.
 *
 * @remarks
 * Any two reports compare, at any distance. Without `b` the latest report is used, and without `a` the newest report
 * of an earlier date than `b`. A pair picked newest first is swapped, so a change always reads forward in time.
 * Both must be in the profile's done reports, so a report of another profile or owner answers 404.
 */
export async function compareReports(
  userId: string,
  query: CompareQuery,
  locale: TextLocale = "en",
) {
  const profileId = query.b
    ? await repo.findReportProfileId(userId, query.b)
    : (await getOwnedProfile(userId, query.profileId ?? "")).id;
  const notFound = new AppError(404, "We could not find this report");
  if (!profileId) throw notFound;
  const [ordered, rows] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId),
  ]);
  const chosenB = query.b ? ordered.find((r) => r.id === query.b) : ordered.at(-1);
  const chosenA = query.a
    ? ordered.find((r) => r.id === query.a)
    : chosenB && ordered.findLast((r) => visitDate(r) < visitDate(chosenB));
  if ((query.b && !chosenB) || (query.a && !chosenA)) throw notFound;
  const [a, b] =
    chosenA && chosenB && ordered.indexOf(chosenA) > ordered.indexOf(chosenB)
      ? [chosenB, chosenA]
      : [chosenA, chosenB];

  const picked = pickRows(rows);
  const rowsA = a ? picked.get(a.id) : undefined;
  const rowsB = b ? picked.get(b.id) : undefined;
  const keys = a && b ? new Set([...(rowsA?.keys() ?? []), ...(rowsB?.keys() ?? [])]) : [];
  const compared = [...keys].sort(byCatalogOrder).flatMap((key) => {
    const entry = catalog.get(key)?.entry;
    if (!entry) return [];
    const rowA = rowsA?.get(key);
    const rowB = rowsB?.get(key);
    const statusA = rowA ? statusOf(rowA) : null;
    const statusB = rowB ? statusOf(rowB) : null;
    const unit = rowB?.unit ?? rowA?.unit ?? null;
    const valueA = rowA ? valueInUnit(entry, rowA, unit) : null;
    return [
      {
        markerKey: key,
        name: entry.name,
        category: entry.category,
        unit,
        precision: entry.precision,
        valueA,
        valueB: rowB ? (rowB.value ?? rowB.valueText) : null,
        statusA,
        statusB,
        change:
          typeof valueA === "number" && rowB && rowB.value !== null
            ? computeChange(valueA, rowB.value)
            : null,
        verdictChange: verdictChange(statusA, statusB),
      },
    ];
  });

  const summary = { improved: 0, worsened: 0, same: 0, new: 0, gone: 0 };
  for (const row of compared) summary[row.verdictChange] += 1;

  return {
    profileId,
    reports: ordered.map(toHeader),
    a: a ? toHeader(a) : null,
    b: b ? toHeader(b) : null,
    summary,
    groups: categories.flatMap(({ key }) => {
      const label = categoryLabel(key, locale);
      const items = compared.filter((row) => row.category === key);
      return items.length > 0 ? [{ key, label, rows: items }] : [];
    }),
  };
}
