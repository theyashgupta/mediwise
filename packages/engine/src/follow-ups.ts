import { markers, type Marker } from "./catalog/index.js";
import { bySeverity } from "./rank.js";
import { findTextRule, type Assessed } from "./status.js";
import type { FollowUp, FollowUpKind } from "./types.js";

const alwaysSuggested = new Set(["lipoprotein_a", "insulin_fasting", "hs_crp", "apolipoprotein_b"]);

type FollowUpCopy = Pick<FollowUp, "title" | "why" | "next">;

export const followUpTemplates: Record<FollowUpKind, (marker: Marker) => FollowUpCopy> = {
  supplement: (marker) => ({
    title: `Ask your doctor about a supplement for low ${marker.name}`,
    why: `Your ${marker.name} is below your calibrated range. ${marker.whyItMatters}`,
    next: `Ask your doctor whether a supplement suits you and what dose to take. Retest in 8 to 12 weeks. ${marker.whatMovesIt}`,
  }),
  retest: (marker) => ({
    title: `Retest ${marker.name} in 8 to 12 weeks`,
    why: `Your ${marker.name} is well outside your calibrated range. ${marker.whyItMatters}`,
    next: `${marker.whatMovesIt} Book a retest in 8 to 12 weeks. Take both reports to your doctor.`,
  }),
  measure: (marker) => ({
    title: `Measure ${marker.name}`,
    why: `${marker.name} is not on this report. ${marker.whyItMatters}`,
    next: `Ask for ${marker.name} at your next blood test. ${marker.whatItIs}`,
  }),
};

/** Lists the core markers and high-value extras that the report does not include, in catalog order. */
export function findUnmeasured(assessed: Assessed[]): Marker[] {
  const onReport = new Set(assessed.map(({ entry }) => entry.key));
  return markers.filter(
    (marker) => (marker.core || alwaysSuggested.has(marker.key)) && !onReport.has(marker.key),
  );
}

function textFollowUp({ entry, result }: Assessed): FollowUpCopy | undefined {
  return typeof result.value === "string" ? findTextRule(entry, result.value)?.followUp : undefined;
}

/**
 * Builds the follow-ups from fixed templates: supplements first, then retests furthest from optimal first, then markers to measure.
 *
 * @remarks
 * A supplement follow-up needs both a low value and the catalog's `supplementable` flag, so the engine never suggests a supplement for a high value.
 * A text result whose catalog rule carries a follow-up gets it at any status, while a numeric result gets a retest only at risk.
 */
export function buildFollowUps(assessed: Assessed[], unmeasured: Marker[]): FollowUp[] {
  const ranked = [...assessed].sort(bySeverity);
  const supplements = ranked.filter(
    ({ entry, result }) => entry.supplementable && result.deviation < 0,
  );
  const retests = ranked.filter((item) => item.result.status === "risk" || textFollowUp(item));
  const items: { kind: FollowUpKind; marker: Marker; copy?: FollowUpCopy }[] = [
    ...supplements.map(({ entry }) => ({ kind: "supplement" as const, marker: entry })),
    ...retests.map((item) => ({
      kind: "retest" as const,
      marker: item.entry,
      copy: textFollowUp(item),
    })),
    ...unmeasured.map((marker) => ({ kind: "measure" as const, marker })),
  ];
  return items.map(({ kind, marker, copy }, index) => ({
    kind,
    markerKey: marker.key,
    ...(copy ?? followUpTemplates[kind](marker)),
    rank: index + 1,
  }));
}
