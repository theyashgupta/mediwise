import type { Status } from "@/common/utils/status";

/** Formats a number with the marker's precision. */
export function formatValue(value: number, precision: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: precision });
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
  const side = !deviation ? "outside" : deviation > 0 ? "above" : "below";
  switch (status) {
    case "optimal":
      return `Your ${name} is in the optimal range for your profile.`;
    case "watch":
      return `Your ${name} is ${side} the optimal range, but in the watch range.`;
    case "risk":
      return `Your ${name} is ${side} the ${hasWatch ? "watch" : "lab"} range. Speak with a doctor about this value.`;
    case "unknown":
      return "MediWise did not score this value. No calibrated range applies to your profile.";
  }
}

/** Formats the change from one value to the next with an explicit sign. */
export function formatDelta(current: number, previous: number, precision: number) {
  const delta = Number((current - previous).toFixed(precision));
  if (delta === 0) return "No change";
  return `${delta > 0 ? "+" : "−"}${formatValue(Math.abs(delta), precision)}`;
}
