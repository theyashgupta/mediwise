import { derived, markers } from "./catalog/index.js";
import { deviation, trendDirection } from "./status.js";
import type { FindingSeverity, Settlement, TrendDirection, Visit, VisitMarker } from "./types.js";

export type AttentionVisit = Pick<Visit, "date" | "markers"> & { reportId: string };

export type AttentionAlert = {
  reportId: string;
  date: string;
  title: string;
  settlement?: Pick<Settlement, "state" | "reportId">;
};

export type AttentionGroup = "risk" | "worsening" | "watch";

export type AttentionMarker = {
  kind: "marker";
  group: AttentionGroup;
  markerKey: string;
  reportId: string;
  date: string;
  value: number;
  unit: string | null;
  status: FindingSeverity;
  deviation: number;
  direction: TrendDirection;
  precision: number;
  previous: { reportId: string; date: string; value: number } | null;
};

export type AttentionItem =
  AttentionMarker | { kind: "alert"; group: "risk"; reportId: string; date: string; title: string };

type Point = {
  reportId: string;
  date: string;
  row: VisitMarker & { value: number; status: FindingSeverity };
};

const catalog = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));
const groupOrder: AttentionGroup[] = ["risk", "worsening", "watch"];

/**
 * Collects the scored values of each marker, one per visit date, oldest first.
 *
 * @remarks
 * A later row of the same date replaces the earlier one, so the caller orders rows by upload, then by worst status.
 */
export function seriesOf(visits: AttentionVisit[]) {
  const series = new Map<string, Point[]>();
  for (const { reportId, date, markers: rows } of visits) {
    for (const row of rows) {
      if (row.value === null || row.status === null) continue;
      const points = series.get(row.markerKey) ?? [];
      if (points.at(-1)?.date === date) points.pop();
      points.push({ reportId, date, row: { ...row, value: row.value, status: row.status } });
      series.set(row.markerKey, points);
    }
  }
  return series;
}

function toItem(markerKey: string, all: Point[]) {
  const last = all.at(-1)!;
  const previous = all.filter(({ row }) => row.unit === last.row.unit).at(-2);
  const entry = catalog.get(markerKey);
  const optimal = { low: last.row.calibratedLow, high: last.row.calibratedHigh };
  const direction =
    entry && previous
      ? trendDirection(
          entry.direction,
          previous.row.value,
          last.row.value,
          entry.precision,
          optimal,
        )
      : "stable";
  const group =
    last.row.status === "risk"
      ? "risk"
      : direction === "worsening"
        ? "worsening"
        : last.row.status === "watch"
          ? "watch"
          : undefined;
  if (!group) return [];
  const item: AttentionMarker = {
    kind: "marker",
    group,
    markerKey,
    reportId: last.reportId,
    date: last.date,
    value: last.row.value,
    unit: last.row.unit,
    status: last.row.status,
    deviation: deviation(last.row.value, { optimalLow: optimal.low, optimalHigh: optimal.high }),
    direction,
    precision: entry?.precision ?? 2,
    previous: previous
      ? { reportId: previous.reportId, date: previous.date, value: previous.row.value }
      : null,
  };
  return [{ item, distance: Math.abs(item.deviation) }];
}

/**
 * Keeps the study alert lines that no later report settles, one per line, newest first.
 *
 * @remarks
 * A confirmed alert drops out when the confirming report has its own alert, because that report prints the line again.
 */
function openAlerts(alerts: AttentionAlert[]) {
  const alerted = new Set(alerts.map(({ reportId }) => reportId));
  const seen = new Set<string>();
  return alerts
    .filter(({ settlement }) => settlement?.state !== "settled")
    .filter(({ settlement }) => !(settlement && alerted.has(settlement.reportId)))
    .toSorted((a, b) => b.date.localeCompare(a.date))
    .filter(({ title }) => {
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    })
    .map(({ reportId, date, title }) => ({
      kind: "alert" as const,
      group: "risk" as const,
      reportId,
      date,
      title,
    }));
}

/**
 * Lists what needs attention across every report of a profile: risk, then worsening, then watch.
 *
 * @remarks
 * Each marker is judged on its latest value, whatever report it came from, and on its direction from the value before.
 * Open study alert lines lead the risk group. `visits` must be in date order, oldest first.
 */
export function buildAttention(
  visits: AttentionVisit[],
  alerts: AttentionAlert[] = [],
): AttentionItem[] {
  const items = [...seriesOf(visits)].flatMap(([key, points]) => toItem(key, points));
  const ranked = groupOrder.flatMap((group) =>
    items
      .filter(({ item }) => item.group === group)
      .sort((a, b) => b.distance - a.distance)
      .map(({ item }) => item),
  );
  return [...openAlerts(alerts), ...ranked];
}
