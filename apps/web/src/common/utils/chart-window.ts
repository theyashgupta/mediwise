const dayMs = 86_400_000;
const recentDays = 90;
const minRecentPoints = 3;
const labelGap = 1 / 7;

export type ChartRange = "recent" | "all";

/** Turns a plain `YYYY-MM-DD` date into a UTC timestamp for a time axis. */
export function dayTime(day: string) {
  return Date.parse(day.slice(0, 10));
}

/**
 * Tells whether a plain date falls in the last 90 days before today.
 *
 * @remarks
 * Today is the reader's local calendar day, compared with the plain date as whole UTC days.
 */
export function isRecent(day: string, today: Date) {
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return todayUtc - dayTime(day) <= recentDays * dayMs;
}

/**
 * Picks the first view of a value chart: the last 90 days when they hold three points or more, else the full range.
 *
 * @remarks
 * A weekly history packs many points into a few weeks, so the recent view keeps them apart. A yearly history keeps its
 * full range, because a short view would show one point.
 */
export function defaultChartRange(days: string[], today: Date): ChartRange {
  return days.filter((day) => isRecent(day, today)).length >= minRecentPoints ? "recent" : "all";
}

/**
 * Picks which points get a value label, so no two labels sit closer than a seventh of the time span.
 *
 * @remarks
 * Walks from the newest point back, so the latest value always has its label. The tooltip shows every other value.
 */
export function labelledIndexes(times: number[]) {
  const span = (times.at(-1) ?? 0) - (times[0] ?? 0);
  const labelled = new Set<number>();
  let last: number | undefined;
  for (let i = times.length - 1; i >= 0; i--) {
    const time = times[i]!;
    if (last === undefined || last - time >= span * labelGap) {
      labelled.add(i);
      last = time;
    }
  }
  return labelled;
}

/**
 * Gives the time axis domain with room on each side, so the first and last dots do not sit on the edge.
 *
 * @remarks
 * A single day gets one day of room on each side, because a zero span has no scale.
 */
export function timeDomain(times: number[]): [number, number] {
  const min = Math.min(...times);
  const max = Math.max(...times);
  const pad = max > min ? (max - min) * 0.04 : dayMs;
  return [min - pad, max + pad];
}
