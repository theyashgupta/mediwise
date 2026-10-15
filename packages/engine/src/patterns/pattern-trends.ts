import { type AttentionVisit, seriesOf } from "../attention.js";
import { derived, markers } from "../catalog/index.js";
import { deviation, trendDirection } from "../status.js";
import type { MarkerResult, PatternMatch, TrendDirection, VisitMarker } from "../types.js";
import { runPatterns } from "./run-patterns.js";

export type PatternChange = "new" | TrendDirection | "cleared";

export type PatternTrend = Omit<PatternMatch, "matched"> & {
  change: PatternChange | null;
  matched: (PatternMatch["matched"][number] & { reportId: string })[];
};

type Latest = Map<string, { reportId: string; row: VisitMarker & { value: number } }>;

const catalog = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));

/** Keeps the last point of each marker, or the last one dated before `before` when it is given. */
function latestOf(series: ReturnType<typeof seriesOf>, before?: string): Latest {
  const latest: Latest = new Map();
  for (const [markerKey, points] of series) {
    const last = points.findLast(({ date }) => !before || date < before);
    if (last) latest.set(markerKey, { reportId: last.reportId, row: last.row });
  }
  return latest;
}

function evaluate(latest: Latest) {
  const results = [...latest].map(([markerKey, { row }]): MarkerResult => ({
    markerKey,
    value: row.value,
    unit: row.unit ?? "",
    status: row.status ?? "unknown",
    calibrated: null,
    deviation: deviation(row.value, {
      optimalLow: row.calibratedLow,
      optimalHigh: row.calibratedHigh,
    }),
  }));
  return runPatterns({ markers: results, derived: [] });
}

/**
 * Compares a pattern that matches in both evaluations through the moves of its matched conditions.
 *
 * @remarks
 * More matched conditions is worse and fewer is better. With the same count, a condition that worsens while none
 * improves is worse, and the other way round. A ratio condition compares the ratio itself, where higher is worse.
 */
function changeOf(now: PatternMatch, before: PatternMatch, latest: Latest) {
  if (now.matched.length !== before.matched.length)
    return now.matched.length > before.matched.length ? "worsening" : "improving";
  const moves = new Set<TrendDirection>(
    now.matched.map(({ markerKey, name, value, unit }) => {
      const earlier = before.matched.find((condition) => condition.name === name);
      const entry = catalog.get(markerKey);
      const row = latest.get(markerKey)?.row;
      if (!earlier || !entry || !row || unit !== earlier.unit) return "stable";
      if (typeof value !== "number" || typeof earlier.value !== "number") return "stable";
      if (unit === "ratio")
        return trendDirection("high_is_bad", earlier.value, value, 2, { low: null, high: null });
      return trendDirection(entry.direction, earlier.value, value, entry.precision, {
        low: row.calibratedLow,
        high: row.calibratedHigh,
      });
    }),
  );
  if (moves.has("worsening") && !moves.has("improving")) return "worsening";
  if (moves.has("improving") && !moves.has("worsening")) return "improving";
  return "stable";
}

function withReports(match: PatternMatch, latest: Latest) {
  return {
    ...match,
    matched: match.matched.map((condition) => ({
      ...condition,
      reportId: latest.get(condition.markerKey)!.reportId,
    })),
  };
}

/**
 * Checks the catalog patterns on the latest value of each marker across every visit, against the evaluation before the
 * newest visit date.
 *
 * @remarks
 * `visits` must be oldest first, as the attention list needs. With one visit date there is no previous evaluation, so
 * `change` is null. A pattern that matched before and not now comes last as `cleared`.
 */
export function buildPatternTrends(visits: AttentionVisit[]): PatternTrend[] {
  const series = seriesOf(visits);
  const newest = visits.at(-1)?.date ?? "";
  const hasPrevious = visits.some(({ date }) => date < newest);
  const latest = latestOf(series);
  const previous = latestOf(series, newest);
  const before = new Map(evaluate(previous).map((match) => [match.key, match]));
  const now = evaluate(latest);
  const nowKeys = new Set(now.map(({ key }) => key));
  const current = now.map((match): PatternTrend => {
    const earlier = before.get(match.key);
    const change = !hasPrevious ? null : earlier ? changeOf(match, earlier, latest) : "new";
    return { ...withReports(match, latest), change };
  });
  const cleared = [...before.values()]
    .filter(({ key }) => !nowKeys.has(key))
    .map((match): PatternTrend => ({ ...withReports(match, previous), change: "cleared" }));
  return [...current, ...cleared];
}
