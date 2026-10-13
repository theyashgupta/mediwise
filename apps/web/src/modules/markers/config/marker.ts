import { getIntlTag, getT } from "@/common/hooks/use-locale";
import type { Status } from "@/common/utils/status";

/** Formats a number with the marker's precision. */
export function formatValue(value: number, precision: number) {
  return value.toLocaleString(getIntlTag(), { maximumFractionDigits: precision });
}

/**
 * Writes the one sentence that says where the value sits for this person.
 *
 * @remarks
 * Without a catalog watch band the engine scored against the lab range, so a risk value is outside the lab range.
 */
export function statusSentence(
  name: string,
  status: Status,
  deviation: number | null,
  hasWatch: boolean,
) {
  const t = getT().markers;
  const side = t.side[!deviation ? "outside" : deviation > 0 ? "above" : "below"];
  switch (status) {
    case "optimal":
      return t.sentence.optimal(name);
    case "watch":
      return t.sentence.watch(name, side);
    case "risk":
      return t.sentence.risk(name, side, t.rangeName[hasWatch ? "watch" : "lab"]);
    case "unknown":
      return t.sentence.unknown;
  }
}

/** Formats the change from one value to the next with an explicit sign. */
export function formatDelta(current: number, previous: number, precision: number) {
  const delta = Number((current - previous).toFixed(precision));
  if (delta === 0) return getT().markers.noChange;
  return `${delta > 0 ? "+" : "−"}${formatValue(Math.abs(delta), precision)}`;
}
