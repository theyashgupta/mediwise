import { countsInScore } from "./catalog/index.js";
import { deriveMarkers } from "./derived.js";
import { buildFollowUps, findUnmeasured } from "./follow-ups.js";
import { normaliseValues } from "./normalise.js";
import { buildDoctorQuestions, runPatterns } from "./patterns/run-patterns.js";
import { rankMoveFirst, toMoveFirst } from "./rank.js";
import { scorePanel } from "./score.js";
import { assess } from "./status.js";
import type { EngineInput, EngineOutput, EngineProfile, EngineValue } from "./types.js";
import { writeVerdict } from "./verdict.js";

/**
 * Turns a profile and extracted values into statuses, score, ranking, follow-ups and the unmeasured list.
 *
 * @remarks
 * Pure: no I/O and no clock, so the same input always gives the same output.
 */
export function runEngine(input: EngineInput): EngineOutput {
  const { normalised, unmapped } = normaliseValues(input.values);
  const assessed = normalised.map((item) => assess(item, input.profile));
  const scored = assessed.filter(({ entry }) => countsInScore(entry));
  const moveFirst = rankMoveFirst(scored);
  const unmeasured = findUnmeasured(assessed);
  const results = assessed.map(({ result }) => result);
  const derivedResults = deriveMarkers(assessed, input.profile);
  const patterns = runPatterns({ markers: results, derived: derivedResults });
  return {
    markers: results,
    derived: derivedResults,
    unmapped,
    score: scorePanel(scored),
    verdict: writeVerdict(scored, moveFirst[0]),
    moveFirst: moveFirst.map(toMoveFirst),
    followUps: buildFollowUps(scored, unmeasured),
    unmeasured: unmeasured.map(({ key, name, description }) => ({
      markerKey: key,
      name,
      description,
    })),
    patterns,
    doctorQuestions: buildDoctorQuestions(results, patterns),
  };
}

/**
 * Gives keyed measurements, such as ECG values or scan sizes, a status from the catalog or the printed range.
 *
 * @remarks
 * Pure like `runEngine`. A key the catalog does not hold, or a unit it cannot convert, comes back with no result.
 */
export function assessMeasurements(values: EngineValue[], profile: EngineProfile) {
  return values.map((value) => {
    const { normalised } = normaliseValues([value]);
    const [item] = normalised;
    return item && value.markerKey === item.entry.key ? assess(item, profile).result : undefined;
  });
}

export * from "./catalog/index.js";
export { isPopulationRow, joinWrappedNames } from "./printed-names.js";
export { toCanonical } from "./normalise.js";
export { rankMoveFirst } from "./rank.js";
export { retestDueDate } from "./retest.js";
export { coverageCap, sameScoreScale, scoreFormula } from "./score.js";
export { deviation, matchRange, trendDirection } from "./status.js";
export type * from "./types.js";
export { alertHeadline, alertHeadlineStart, buildFindings } from "./findings.js";
export {
  daysBetween,
  openQuestions,
  repeatMarkerDays,
  repeatStudyDays,
  repeatsMarker,
  repeatsStudy,
  settleFinding,
  typicalGapDays,
} from "./sequence.js";
export {
  buildEpisode,
  type Episode,
  episodeMinVisits,
  episodeWindowDays,
  type EpisodeVisit,
  proposeEpisode,
} from "./episode.js";
export { patterns } from "./patterns/catalog.js";
export { alertKeys } from "./patterns/study-alerts.js";
export {
  categoryLabel,
  localizeAlertHeadline,
  localizeFollowUp,
  localizeVerdict,
} from "./localize.js";
export { hindiReviewMarkdown } from "./catalog/review.js";
