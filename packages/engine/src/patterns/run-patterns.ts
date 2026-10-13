import { derived, markers, type Marker } from "../catalog/index.js";
import { round } from "../normalise.js";
import { bySeverity, withUnit } from "../rank.js";
import type {
  EngineOutput,
  MarkerResult,
  MatchedCondition,
  Pattern,
  PatternBand,
  PatternCondition,
  PatternMatch,
  PatternStudy,
} from "../types.js";
import { links, patterns } from "./catalog.js";

const maxDoctorQuestions = 8;
const entries = new Map<string, Marker>([...markers, ...derived].map((e) => [e.key, e]));

type Results = Map<string, MarkerResult>;

function band({ status, deviation }: MarkerResult): PatternBand | undefined {
  if (status === "unknown") return undefined;
  if (status === "optimal") return "optimal";
  return `${status}_${deviation < 0 ? "low" : "high"}`;
}

/** Returns a result's value only when it is a number in the catalog's canonical unit. */
function canonicalValue(result: MarkerResult | undefined): number | undefined {
  if (!result || typeof result.value !== "number") return undefined;
  return result.unit === entries.get(result.markerKey)?.unit ? result.value : undefined;
}

function matchCondition(
  condition: PatternCondition,
  results: Results,
): MatchedCondition | undefined {
  const result = results.get(condition.markerKey);
  const name = entries.get(condition.markerKey)?.name ?? condition.markerKey;
  const matched = result && {
    markerKey: result.markerKey,
    name,
    value: result.value,
    unit: result.unit,
  };
  const value = canonicalValue(result);
  switch (condition.comparator) {
    case "measured":
      return matched;
    case "status_is": {
      const current = result && band(result);
      return current && condition.threshold.includes(current) ? matched : undefined;
    }
    case "value_above":
      return value !== undefined && value > condition.threshold ? matched : undefined;
    case "value_below":
      return value !== undefined && value < condition.threshold ? matched : undefined;
    case "ratio_above": {
      const denominator = canonicalValue(results.get(condition.denominatorKey));
      if (value === undefined || !denominator) return undefined;
      const ratio = round(value / denominator, 2);
      const below = entries.get(condition.denominatorKey)?.name ?? condition.denominatorKey;
      return ratio > condition.threshold
        ? {
            markerKey: condition.markerKey,
            name: `${name} to ${below} ratio`,
            value: ratio,
            unit: "ratio",
          }
        : undefined;
    }
  }
}

const negation = /\b(no|not|without|negative for|absence of)\b/i;

/**
 * Finds the studies whose printed impression says what a link pattern looks for.
 *
 * @remarks
 * Each impression line is checked alone, and a line with a negation word never counts, so "No renal calculus" is no match.
 */
function studiesSaying(study: NonNullable<Pattern["study"]>, studies: PatternStudy[]) {
  const says = new RegExp(study.says, "i");
  return studies.filter(
    ({ kind, impression }) =>
      study.kinds.includes(kind) &&
      (impression ?? "").split(/\n|\.\s/).some((line) => says.test(line) && !negation.test(line)),
  );
}

function matchPatterns(
  list: Pattern[],
  output: Pick<EngineOutput, "markers" | "derived">,
  studies: PatternStudy[],
): PatternMatch[] {
  const results: Results = new Map(
    [...output.markers, ...output.derived].map((result) => [result.markerKey, result]),
  );
  const found = list.flatMap(({ conditions, minMatches, study, ...pattern }) => {
    const seen = study ? studiesSaying(study, studies) : [];
    if (study && seen.length === 0) return [];
    const checked = conditions.map((condition) => ({
      condition,
      matched: matchCondition(condition, results),
    }));
    const matched = checked.flatMap((item) => (item.matched ? [item.matched] : []));
    const requiredHold = checked.every((item) => !item.condition.required || item.matched);
    if (!requiredHold || matched.length < minMatches) return [];
    return [
      study ? { ...pattern, matched, studyIds: seen.map(({ id }) => id) } : { ...pattern, matched },
    ];
  });
  return [
    ...found.filter((match) => match.severity === "risk"),
    ...found.filter((match) => match.severity === "watch"),
  ];
}

/**
 * Checks every catalog pattern against the scored markers and returns the ones that match, risk first.
 *
 * @remarks
 * A pattern matches when all its required conditions hold and at least `minMatches` conditions hold in total.
 */
export function runPatterns(output: Pick<EngineOutput, "markers" | "derived">): PatternMatch[] {
  return matchPatterns(patterns, output, []);
}

/** Checks the link patterns, which join a printed study result with the markers of the same visit. */
export function runLinks(
  output: Pick<EngineOutput, "markers" | "derived">,
  studies: PatternStudy[],
): PatternMatch[] {
  return matchPatterns(links, output, studies);
}

/** Asks the doctor about one marker with risk status. */
export function riskQuestion(result: Pick<MarkerResult, "markerKey" | "value" | "unit">) {
  const name = entries.get(result.markerKey)?.name ?? result.markerKey;
  return `My ${name} is ${withUnit(result.value, result.unit)}. Should we retest or investigate?`;
}

/**
 * Lists up to 8 questions for the doctor: the matched patterns' questions, then one per risk marker, furthest from optimal first.
 */
export function buildDoctorQuestions(
  results: MarkerResult[],
  matches: Pick<PatternMatch, "askDoctor">[],
): string[] {
  const markerQuestions = results
    .filter((result) => result.status === "risk")
    .sort((a, b) => bySeverity({ result: a }, { result: b }))
    .map(riskQuestion);
  const questions = new Set([...matches.flatMap((match) => match.askDoctor), ...markerQuestions]);
  return [...questions].slice(0, maxDoctorQuestions);
}
