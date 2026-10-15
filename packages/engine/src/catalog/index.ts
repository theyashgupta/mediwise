import { derived } from "./derived.js";
import { createMarkerFinder } from "./find-marker.js";
import { bloodCountMarkers } from "./markers/blood-count.js";
import { boneMarkers } from "./markers/bone.js";
import { cardiacMarkers } from "./markers/cardiac.js";
import { electrolyteMarkers } from "./markers/electrolytes.js";
import { hormoneMarkers } from "./markers/hormones.js";
import { inflammationMarkers } from "./markers/inflammation.js";
import { ironMarkers } from "./markers/iron.js";
import { kidneyMarkers } from "./markers/kidney.js";
import { lipidMarkers } from "./markers/lipids.js";
import { liverMarkers } from "./markers/liver.js";
import { metabolicMarkers } from "./markers/metabolic.js";
import { otherMarkers } from "./markers/other.js";
import { thyroidMarkers } from "./markers/thyroid.js";
import { urateMarkers } from "./markers/urate.js";
import { urineMarkers } from "./markers/urine.js";
import { vitalMarkers } from "./markers/vitals.js";
import { vitaminMarkers } from "./markers/vitamins.js";
import type { Category, Marker } from "./schema.js";

export const markers: Marker[] = [
  ...metabolicMarkers,
  ...lipidMarkers,
  ...cardiacMarkers,
  ...inflammationMarkers,
  ...liverMarkers,
  ...kidneyMarkers,
  ...thyroidMarkers,
  ...vitaminMarkers,
  ...ironMarkers,
  ...bloodCountMarkers,
  ...electrolyteMarkers,
  ...boneMarkers,
  ...urateMarkers,
  ...hormoneMarkers,
  ...urineMarkers,
  ...vitalMarkers,
  ...otherMarkers,
];

export const coreMarkerKeys = markers.filter((marker) => marker.core).map((marker) => marker.key);

const statusOnly = new Set<Category>(["vitals", "studies"]);

/**
 * Tells whether a catalog entry adds to the score, the verdict, move first and follow-ups.
 *
 * @remarks
 * Vitals and study measurements get a status only in v1, so an examination form or a scan never moves a lab score.
 */
export function countsInScore(entry: Pick<Marker, "category">): boolean {
  return !statusOnly.has(entry.category);
}

const findAnyMarker = createMarkerFinder([...markers, ...derived]);
const findUrineMarker = createMarkerFinder(
  [...markers, ...derived].filter((entry) => entry.key.startsWith("urine_")),
);

/** Tells whether a printed panel heading is a urine panel. */
function isUrinePanel(panel?: string): boolean {
  return panel !== undefined && /\burin/i.test(panel);
}

/**
 * Tells whether a catalog key can hold a test printed under this panel.
 *
 * @remarks
 * A urine panel reuses blood test names such as "Bilirubin" and "Red Blood Cells", so only `urine_` keys fit it.
 */
export function fitsPanel(markerKey: string, panel?: string): boolean {
  return !isUrinePanel(panel) || markerKey.startsWith("urine_");
}

/**
 * Finds the catalog entry for a printed test name, inside its panel when the panel is known.
 *
 * @remarks
 * Inside a urine panel the word "urine" is implied, so the name is also tried with it before and after.
 * Under a heading that names a smear, a text result printed as a bare count name such as "RBC" is a smear finding.
 */
export function findMarker(
  rawName: string,
  panel?: string,
  value?: number | string,
): Marker | undefined {
  if (isUrinePanel(panel)) {
    return [rawName, `Urine ${rawName}`, `${rawName} Urine`]
      .map(findUrineMarker)
      .find((entry) => entry !== undefined);
  }
  const entry = findAnyMarker(rawName);
  if (typeof value !== "string" || !/smear/i.test(panel ?? "") || entry?.unit === "text") {
    return entry;
  }
  const smear = findAnyMarker(`Smear ${rawName}`);
  return smear?.unit === "text" ? smear : entry;
}

export { lifestyle, urgentLimits } from "./advice.js";
export { categories } from "./categories.js";
export { computeDerived, type DerivedProfile } from "./compute-derived.js";
export { derived } from "./derived.js";
export { normalizeName } from "./find-marker.js";
export * from "./schema.js";
export { sources } from "./sources.js";
export { studyMarkers } from "./studies.js";
export {
  devanagariWordCount,
  type FollowUpText,
  hindiCopyProblems,
  hindiSentences,
  lifestyleText,
  type LifestyleText,
  markerText,
  type MarkerText,
  patternText,
  type PatternText,
  textLocales,
  type TextLocale,
} from "./text.js";
