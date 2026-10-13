import { derived, markers } from "./catalog/index.js";
import type { MarkerStatus } from "./types.js";

const dayMs = 86_400_000;
const retestByKey = new Map(
  [...markers, ...derived].flatMap((entry) => (entry.retest ? [[entry.key, entry.retest]] : [])),
);

/**
 * Gives the suggested retest date of a marker, as a plain `YYYY-MM-DD` date.
 *
 * @remarks
 * The date is the collection date plus the catalog weeks for that status. A marker or status with no sourced interval gives no date.
 */
export function retestDueDate(
  markerKey: string,
  status: MarkerStatus,
  collectedAt: string,
): string | undefined {
  const weeks = retestByKey.get(markerKey)?.find((item) => item.status === status)?.weeks;
  if (weeks === undefined) return undefined;
  return new Date(Date.parse(collectedAt) + weeks * 7 * dayMs).toISOString().slice(0, 10);
}
