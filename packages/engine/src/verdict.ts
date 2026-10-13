import type { Assessed } from "./status.js";

/** Writes the one-sentence verdict from the scored markers and the top move-first marker. */
export function writeVerdict(assessed: Assessed[], top: Assessed | undefined): string {
  const scored = assessed.filter(({ result }) => result.status !== "unknown");
  if (scored.length === 0) {
    return "We could not check any marker on this report against a calibrated range.";
  }
  if (!top)
    return `All ${scored.length} markers sit in your calibrated ranges. Nothing needs to move first.`;
  const optimal = scored.filter(({ result }) => result.status === "optimal").length;
  return `${optimal} of ${scored.length} markers sit in your calibrated ranges. ${top.entry.name} is the one to move first.`;
}
