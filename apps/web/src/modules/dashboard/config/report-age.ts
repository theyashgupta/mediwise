const dayMs = 86_400_000;
const frequentGapDays = 31;
const recentRetestDays = 30;

/**
 * Counts whole days from a plain report date to today.
 *
 * @remarks
 * Today is the reader's local calendar day, compared with the plain report date as whole UTC days.
 */
function daysSince(date: string, today: Date) {
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return (todayUtc - Date.parse(date)) / dayMs;
}

/**
 * Gives the number of days after which a profile's latest report reads as old.
 *
 * @remarks
 * A profile that sends a report every month or more often reads as old after 90 days, others after 365 days.
 */
export function staleAfterDays(typicalGapDays: number | null) {
  return typicalGapDays !== null && typicalGapDays <= frequentGapDays ? 90 : 365;
}

/** Tells whether a report date is more than the stale limit before today. */
export function isStale(date: string, typicalGapDays: number | null, today: Date) {
  return daysSince(date, today) > staleAfterDays(typicalGapDays);
}

/**
 * Tells whether a marker was measured in the last 30 days, so its retest date stays off Home.
 *
 * @remarks
 * A person who tests every week already measures the marker, and a retest date would only add noise.
 */
export function isMeasuredRecently(measuredOn: string, today: Date) {
  return daysSince(measuredOn, today) <= recentRetestDays;
}
