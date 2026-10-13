import { derived, markers, studyMarkers } from "./catalog/index.js";
import { alertLine } from "./patterns/study-alerts.js";
import { daysBetween, sameStudy } from "./sequence.js";
import { trendDirection } from "./status.js";
import type { FindingSeverity, Visit } from "./types.js";

export const episodeWindowDays = 45;
export const episodeMinVisits = 3;

const catalog = new Map(
  [...markers, ...derived, ...studyMarkers].map((entry) => [entry.key, entry]),
);

export type EpisodeVisit = Visit & { reportId: string };

type Dated = { id: string; date: string };

type Point = {
  reportId: string;
  date: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  status: FindingSeverity | null;
  calibratedLow: number | null;
  calibratedHigh: number | null;
};

function visitCount(reports: Dated[]) {
  return new Set(reports.map(({ date }) => date)).size;
}

/**
 * Finds the latest run of reports where every report sits in a 45-day window that holds three visits or more.
 *
 * @remarks
 * Counts visits, not reports, so a yearly checkup split into three files of one date is never an episode. Overlapping
 * windows join into one run, so a workup longer than 45 days stays one proposal.
 */
export function proposeEpisode(reports: Dated[]) {
  const ordered = reports.toSorted((a, b) => a.date.localeCompare(b.date));
  const members = new Set<string>();
  for (const end of ordered) {
    const window = ordered.filter(({ date }) => {
      const days = daysBetween(date, end.date);
      return days >= 0 && days <= episodeWindowDays;
    });
    if (visitCount(window) >= episodeMinVisits) window.forEach(({ id }) => members.add(id));
  }
  const runs: Dated[][] = [];
  for (const report of ordered.filter(({ id }) => members.has(id))) {
    const run = runs.at(-1);
    const last = run?.at(-1);
    if (run && last && daysBetween(last.date, report.date) <= episodeWindowDays) run.push(report);
    else runs.push([report]);
  }
  const latest = runs.at(-1);
  if (!latest) return undefined;
  return {
    reportIds: latest.map(({ id }) => id),
    from: latest[0]!.date,
    to: latest.at(-1)!.date,
  };
}

function flagged(status: FindingSeverity | null) {
  return status === "watch" || status === "risk";
}

/** Collects every marker and study measurement of the visits, one point per visit date, the newest upload winning a date. */
function collectPoints(visits: EpisodeVisit[]) {
  const series = new Map<string, Map<string, Point>>();
  const add = (key: string, point: Point) => {
    if (!catalog.has(key)) return;
    const byDate = series.get(key) ?? new Map<string, Point>();
    series.set(key, byDate);
    byDate.set(point.date, point);
  };
  for (const visit of visits) {
    const base = { reportId: visit.reportId, date: visit.date };
    for (const { markerKey, ...row } of visit.markers) add(markerKey, { ...base, ...row });
    for (const study of visit.studies) {
      for (const { key, ...row } of study.measurements) {
        add(key, { ...base, ...row, valueText: null, calibratedLow: null, calibratedHigh: null });
      }
    }
  }
  return [...series].map(([key, byDate]) => ({ key, points: [...byDate.values()] }));
}

function repeatedMarker(key: string, all: Point[]) {
  const entry = catalog.get(key)!;
  const unit = all.at(-1)?.unit ?? null;
  const points = all.flatMap(({ reportId, date, value, unit: pointUnit, status }) =>
    value !== null && pointUnit === unit ? [{ reportId, date, value, status }] : [],
  );
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last || points.length < 2) return [];
  const lastRow = all.at(-1)!;
  const optimal = { low: lastRow.calibratedLow, high: lastRow.calibratedHigh };
  return [
    {
      markerKey: key,
      name: entry.name,
      unit,
      precision: entry.precision,
      points,
      direction: trendDirection(entry.direction, first.value, last.value, entry.precision, optimal),
    },
  ];
}

/**
 * Groups the visits of one episode into a timeline, repeated markers, studies in order, and what has one flagged value.
 *
 * @remarks
 * Pure ordering and grouping of stored statuses and study alert lines: no new medical rule. A repeated marker keeps only
 * the points in the unit of its latest point, the same rule as the trend pages.
 */
export function buildEpisode(visits: EpisodeVisit[]) {
  const ordered = visits.toSorted((a, b) => a.date.localeCompare(b.date));
  const series = collectPoints(ordered);
  const studies = ordered.flatMap((visit) => visit.studies.map((study) => ({ visit, study })));

  const outstandingMarkers = series.flatMap(({ key, points }) => {
    const [point] = points;
    if (points.length !== 1 || !point || !flagged(point.status)) return [];
    const entry = catalog.get(key)!;
    return [
      {
        markerKey: key,
        name: entry.name,
        unit: point.unit,
        precision: entry.precision,
        reportId: point.reportId,
        date: point.date,
        value: point.value,
        valueText: point.valueText,
        status: point.status!,
      },
    ];
  });
  const outstandingStudies = studies.flatMap(({ visit, study }) => {
    const line = alertLine([study.result, study.impression]) ?? null;
    const once = studies.filter((other) => sameStudy(other.study, study)).length <= 1;
    const watched = line !== null || study.measurements.some(({ status }) => flagged(status));
    if (!watched || !once) return [];
    return [
      {
        studyId: study.id,
        kind: study.kind,
        bodyRegion: study.bodyRegion,
        reportId: visit.reportId,
        date: visit.date,
        line,
      },
    ];
  });

  return {
    from: ordered[0]?.date ?? null,
    to: ordered.at(-1)?.date ?? null,
    timeline: ordered.map((visit) => ({
      reportId: visit.reportId,
      date: visit.date,
      labName: visit.labName,
      markerCount: visit.markers.length,
      flaggedCount: visit.markers.filter(({ status }) => flagged(status)).length,
      studies: visit.studies.map(({ kind, bodyRegion }) => ({ kind, bodyRegion })),
    })),
    repeated: series.flatMap(({ key, points }) => repeatedMarker(key, points)),
    studies: studies.map(({ visit, study }) => ({
      studyId: study.id,
      reportId: visit.reportId,
      date: visit.date,
      kind: study.kind,
      bodyRegion: study.bodyRegion,
      impression: study.impression,
    })),
    outstanding: { markers: outstandingMarkers, studies: outstandingStudies },
  };
}

export type Episode = ReturnType<typeof buildEpisode>;
