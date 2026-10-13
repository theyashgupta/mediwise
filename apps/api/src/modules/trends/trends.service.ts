import {
  categories,
  derived,
  type Marker,
  markers,
  studyMarkers,
  trendDirection,
} from "@mediwise/engine";
import { AppError } from "../../common/errors.js";
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

function toRange(low: number | null, high: number | null) {
  return low === null && high === null ? null : { low, high };
}

/** The day a report belongs to: its collection date, or its upload day when the lab printed none. */
function visitDate(report: Pick<StoredReport, "collectedAt" | "createdAt">) {
  return report.collectedAt ?? report.createdAt.toISOString().slice(0, 10);
}

/**
 * Builds one marker's numeric series across visits, oldest first.
 *
 * @remarks
 * Reports of one collection date are one visit, and the newest report's value wins that date.
 * Only points in the unit of the latest point are kept, so a series never mixes units.
 */
function toSeries(
  entry: Marker,
  ordered: StoredReport[],
  picked: Map<string, Map<string, StoredRow>>,
) {
  const byDate = new Map<string, { report: StoredReport; row: StoredRow; value: number }>();
  for (const report of ordered) {
    const row = picked.get(report.id)?.get(entry.key);
    if (row && row.value !== null) byDate.set(visitDate(report), { report, row, value: row.value });
  }
  const found = [...byDate.values()];
  const unit = found.at(-1)?.row.unit ?? null;
  const kept = found.filter(({ row }) => row.unit === unit);
  const last = kept.at(-1);
  const previous = kept.at(-2);
  const change = last && previous ? computeChange(previous.value, last.value) : null;
  const optimal = { low: last?.row.calibratedLow ?? null, high: last?.row.calibratedHigh ?? null };
  return {
    markerKey: entry.key,
    name: entry.name,
    shortName: entry.shortName ?? null,
    category: entry.category,
    unit,
    precision: entry.precision,
    points: kept.map(({ report, row, value }) => ({
      reportId: report.id,
      labName: report.labName,
      collectedAt: report.collectedAt,
      createdAt: report.createdAt,
      value,
      status: statusOf(row),
    })),
    latestStatus: last ? statusOf(last.row) : "unknown",
    change,
    direction:
      last && previous
        ? trendDirection(entry.direction, previous.value, last.value, entry.precision, optimal)
        : "stable",
    calibratedRange: toRange(optimal.low, optimal.high),
  };
}

/** Lists every marker of a profile measured in at least two done reports, in catalog order. */
export async function listTrends(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  const [ordered, rows] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId),
  ]);
  const picked = pickRows(rows);
  const keys = new Set([...picked.values()].flatMap((report) => [...report.keys()]));
  const series = [...keys]
    .sort(byCatalogOrder)
    .flatMap((key) => {
      const entry = catalog.get(key)?.entry;
      return entry ? [toSeries(entry, ordered, picked)] : [];
    })
    .filter((item) => item.points.length >= 2);
  const present = new Set(series.map((item) => item.category));
  return {
    reportCount: ordered.length,
    categories: categories.filter(({ key }) => present.has(key)),
    markers: series,
  };
}

/** Loads every point of one marker for a profile, with the latest calibrated range. */
export async function getTrend(userId: string, profileId: string, markerKey: string) {
  const known = catalog.get(markerKey);
  const notFound = new AppError(404, "This profile has no value for this marker");
  if (!known) throw notFound;
  await getOwnedProfile(userId, profileId);
  const [ordered, rows] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId, markerKey),
  ]);
  const series = toSeries(known.entry, ordered, pickRows(rows));
  if (series.points.length === 0) throw notFound;
  return series;
}

function toHeader(report: StoredReport) {
  const { id, labName, collectedAt, createdAt, score, tier } = report;
  return { id, labName, collectedAt, createdAt, score, tier };
}

/**
 * Compares two done reports of one profile, marker by marker.
 *
 * @remarks
 * Without `b` the latest report is used, and without `a` the report before `b`. Both must be in the profile's done reports, so a report of another profile or owner answers 404.
 */
export async function compareReports(userId: string, query: CompareQuery) {
  const profileId = query.b
    ? await repo.findReportProfileId(userId, query.b)
    : (await getOwnedProfile(userId, query.profileId ?? "")).id;
  const notFound = new AppError(404, "We could not find this report");
  if (!profileId) throw notFound;
  const [ordered, rows] = await Promise.all([
    repo.listDoneReports(userId, profileId),
    repo.listMarkerRows(userId, profileId),
  ]);
  const bIndex = query.b ? ordered.findIndex((r) => r.id === query.b) : ordered.length - 1;
  const b = ordered[bIndex];
  const a = query.a ? ordered.find((r) => r.id === query.a) : ordered[bIndex - 1];
  if ((query.b && !b) || (query.a && !a)) throw notFound;

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
    return [
      {
        markerKey: key,
        name: entry.name,
        category: entry.category,
        unit: rowB?.unit ?? rowA?.unit ?? null,
        precision: entry.precision,
        valueA: rowA ? (rowA.value ?? rowA.valueText) : null,
        valueB: rowB ? (rowB.value ?? rowB.valueText) : null,
        statusA,
        statusB,
        change:
          rowA && rowB && rowA.value !== null && rowB.value !== null && rowA.unit === rowB.unit
            ? computeChange(rowA.value, rowB.value)
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
    groups: categories.flatMap(({ key, label }) => {
      const items = compared.filter((row) => row.category === key);
      return items.length > 0 ? [{ key, label, rows: items }] : [];
    }),
  };
}
