import type { Assessed } from "./status.js";
import type { CalibratedRange, MarkerResult, MoveFirst } from "./types.js";

type Ranked = { result: Pick<MarkerResult, "status" | "deviation"> };

/** Orders markers by distance from optimal, furthest first. */
export function bySeverity(a: Ranked, b: Ranked): number {
  return Math.abs(b.result.deviation) - Math.abs(a.result.deviation);
}

/**
 * Picks up to 5 markers to move first: risk markers, then watch markers, each furthest from optimal first.
 *
 * @remarks
 * Deviation is compared by size, so a value far below optimal ranks with one far above it.
 */
export function rankMoveFirst<T extends Ranked>(assessed: T[]): T[] {
  const ranked = (status: "risk" | "watch") =>
    assessed.filter(({ result }) => result.status === status).sort(bySeverity);
  return [...ranked("risk"), ...ranked("watch")].slice(0, 5);
}

export function withUnit(value: number | string | null, unit: string): string {
  return !unit || unit === "ratio" || unit === "index" ? `${value}` : `${value} ${unit}`;
}

function describeRange({ optimalLow: low, optimalHigh: high }: CalibratedRange, unit: string) {
  if (low !== null && high !== null) return `${low} to ${withUnit(high, unit)}`;
  if (high !== null) return `up to ${withUnit(high, unit)}`;
  return `${withUnit(low, unit)} or more`;
}

/** Turns a ranked marker into a move-first entry with a one-sentence reason. */
export function toMoveFirst({ entry, result }: Assessed): MoveFirst {
  const severity = result.status === "risk" ? "critical" : "out_of_optimal";
  if (typeof result.value === "string") {
    const printed = [result.value, result.unit].filter(Boolean).join(" ");
    return { markerKey: entry.key, severity, reason: `${entry.name} is ${printed}.` };
  }
  const side = result.deviation < 0 ? "below" : "above";
  const range = result.calibrated ? describeRange(result.calibrated, result.unit) : "";
  return {
    markerKey: entry.key,
    severity,
    reason: `${entry.name} is ${withUnit(result.value, result.unit)}, ${side} your optimal range of ${range}.`,
  };
}
