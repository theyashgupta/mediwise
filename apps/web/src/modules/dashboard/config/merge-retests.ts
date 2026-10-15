import type { RetestDate, RetestRow, Suggestion } from "../types";
import { isMeasuredRecently } from "./report-age";

/**
 * Merges the scheduled retest dates with the retests the suggestions engine proposes, soonest first.
 *
 * @remarks
 * A proposed retest replaces the scheduled date of the same marker and adds its reason. Only scheduled dates skip a
 * marker measured in the last 30 days, because the engine proposes a retest for a flagged value on purpose.
 */
export function mergeRetests(
  scheduled: RetestDate[],
  suggestions: Suggestion[],
  today: Date,
): RetestRow[] {
  const proposed = suggestions.flatMap(({ kind, markers, dueOn, date, why }): RetestRow[] => {
    const marker = markers[0];
    return kind === "retest" && marker && dueOn
      ? [{ markerKey: marker.markerKey, name: marker.name, dueOn, measuredOn: date, why }]
      : [];
  });
  const keys = new Set(proposed.map(({ markerKey }) => markerKey));
  const kept = scheduled.filter(
    ({ markerKey, measuredOn }) => !keys.has(markerKey) && !isMeasuredRecently(measuredOn, today),
  );
  return [...proposed, ...kept].sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}
