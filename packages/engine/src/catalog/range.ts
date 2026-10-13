import type { Interval, Range, Source } from "./schema.js";

type RangeFilter = Pick<Range, "sex" | "ageMin" | "ageMax" | "ancestry">;

/**
 * Builds a range that applies from age 18 unless the filter sets its own ages.
 *
 * @remarks
 * Most guideline cut-offs are adult cut-offs, so a child falls back to the lab range instead of an adult one.
 */
export function range(
  source: Source,
  optimal: Interval,
  watch: Interval,
  filter: RangeFilter = {},
): Range {
  return { ageMin: 18, ...filter, optimal, watch, source: source.id };
}
