import type { Direction, Marker, Range, TextRule } from "./catalog/index.js";
import { round, type Normalised } from "./normalise.js";
import type {
  CalibratedRange,
  EngineProfile,
  LabRange,
  MarkerResult,
  MarkerStatus,
  TrendDirection,
} from "./types.js";

export type Assessed = { entry: Marker; result: MarkerResult };

function specificity(range: Range): number {
  const aged = range.ageMin !== undefined || range.ageMax !== undefined;
  return (range.ancestry ? 4 : 0) + (range.sex ? 2 : 0) + (aged ? 1 : 0);
}

/**
 * Picks the most specific range that applies to the profile.
 *
 * @remarks
 * Ancestry outranks sex, and sex outranks age, so a South Asian range replaces the general one.
 */
export function selectRange(entry: Marker, profile: EngineProfile): Range | undefined {
  let best: Range | undefined;
  for (const range of entry.ranges) {
    const applies =
      (range.sex === undefined || range.sex === profile.sex) &&
      (range.ancestry === undefined || range.ancestry === profile.ancestry) &&
      (range.ageMin ?? 0) <= profile.ageYears &&
      profile.ageYears < (range.ageMax ?? Infinity);
    if (applies && (!best || specificity(range) > specificity(best))) best = range;
  }
  return best;
}

/**
 * Finds the catalog range that produced a stored row, so a page can show its watch band and source.
 *
 * @remarks
 * Ranges are matched on the stored optimal band and status, because age is not stored and the profile can change after the report.
 */
export function matchRange(
  entry: Marker,
  profile: Pick<EngineProfile, "sex" | "ancestry">,
  stored: { value: number; status: MarkerStatus; optimal: [number | null, number | null] },
): Range | undefined {
  const rank = (range: Range) =>
    ((range.sex === undefined || range.sex === profile.sex) &&
    (range.ancestry === undefined || range.ancestry === profile.ancestry)
      ? 8
      : 0) + specificity(range);
  let best: Range | undefined;
  for (const range of entry.ranges) {
    const [optimalLow, optimalHigh] = range.optimal;
    const [watchLow, watchHigh] = range.watch;
    const fits =
      optimalLow === stored.optimal[0] &&
      optimalHigh === stored.optimal[1] &&
      classify(stored.value, { optimalLow, optimalHigh, watchLow, watchHigh }) === stored.status;
    if (fits && (!best || rank(range) > rank(best))) best = range;
  }
  return best;
}

/**
 * Returns the calibrated range for a profile, falling back to the lab range.
 *
 * @remarks
 * The lab range has no watch band, so a value outside it is risk. A child or a profile with sex "other" often has no calibrated range.
 */
export function calibrate(
  entry: Marker,
  profile: EngineProfile,
  labRange?: LabRange,
): CalibratedRange | null {
  const range = selectRange(entry, profile);
  if (range) {
    const [optimalLow, optimalHigh] = range.optimal;
    const [watchLow, watchHigh] = range.watch;
    return { optimalLow, optimalHigh, watchLow, watchHigh, source: range.source };
  }
  if (labRange && (labRange.low !== null || labRange.high !== null)) {
    const { low, high } = labRange;
    return { optimalLow: low, optimalHigh: high, watchLow: low, watchHigh: high, source: "lab" };
  }
  return null;
}

function within(value: number, low: number | null, high: number | null): boolean {
  return (low === null || value >= low) && (high === null || value <= high);
}

/**
 * Signed distance from the nearest optimal bound as a fraction of the optimal width.
 *
 * @remarks
 * A one-sided range has no width, so the distance is a fraction of the bound itself, or of 1 when that bound is 0.
 */
export function deviation(
  value: number,
  calibrated: Pick<CalibratedRange, "optimalLow" | "optimalHigh">,
): number {
  const { optimalLow: low, optimalHigh: high } = calibrated;
  const width = low !== null && high !== null ? high - low : Math.abs(low ?? high ?? 0) || 1;
  if (low !== null && value < low) return round((value - low) / width, 3);
  if (high !== null && value > high) return round((value - high) / width, 3);
  return 0;
}

/**
 * Tells whether the last move of a marker is good, bad or none, from the catalog direction.
 *
 * @remarks
 * A marker improves when it moves closer to its optimal range, so a move inside the range is stable. The catalog direction decides only when there is no optimal range.
 */
export function trendDirection(
  direction: Direction,
  previous: number,
  latest: number,
  precision: number,
  optimal: { low: number | null; high: number | null },
): TrendDirection {
  if (previous.toFixed(precision) === latest.toFixed(precision)) return "stable";
  const unbounded = optimal.low === null && optimal.high === null;
  if (unbounded && direction === "high_is_bad") return latest < previous ? "improving" : "worsening";
  if (unbounded && direction === "low_is_bad") return latest > previous ? "improving" : "worsening";
  const range = { optimalLow: optimal.low, optimalHigh: optimal.high };
  const before = Math.abs(deviation(previous, range));
  const after = Math.abs(deviation(latest, range));
  if (after === before) return "stable";
  return after < before ? "improving" : "worsening";
}

/** Finds the first catalog text rule that matches a printed text result. */
export function findTextRule(entry: Marker, text: string): TextRule | undefined {
  return entry.textRules?.find(({ pattern }) => new RegExp(pattern, "i").test(text.trim()));
}

/**
 * Reads a text result's status from the marker's text rules.
 *
 * @remarks
 * Text that no rule matches is unknown, so a printed word never adds to the score by accident.
 */
function textStatus(entry: Marker, text: string): MarkerStatus {
  return findTextRule(entry, text)?.status ?? "unknown";
}

function classify(
  value: number,
  bands: Pick<CalibratedRange, "optimalLow" | "optimalHigh" | "watchLow" | "watchHigh">,
): MarkerStatus {
  if (within(value, bands.optimalLow, bands.optimalHigh)) return "optimal";
  return within(value, bands.watchLow, bands.watchHigh) ? "watch" : "risk";
}

/** Gives a normalised value its calibrated range, status and deviation. */
export function assess(item: Normalised, profile: EngineProfile): Assessed {
  const { entry, value, unit, labRange } = item;
  const calibrated = item.canonical ? calibrate(entry, profile, labRange) : null;
  let status: MarkerStatus = typeof value === "string" ? textStatus(entry, value) : "unknown";
  let offset = 0;
  if (calibrated && typeof value === "number") {
    status = classify(value, calibrated);
    offset = deviation(value, calibrated);
  }
  return {
    entry,
    result: {
      markerKey: entry.key,
      value,
      unit,
      status,
      calibrated,
      ...(labRange && { labRange }),
      deviation: offset,
    },
  };
}
