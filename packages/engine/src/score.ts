import { categorySchema, coreMarkerKeys, type Category } from "./catalog/index.js";
import type { Assessed } from "./status.js";
import type { Score, Tier } from "./types.js";

const points = { optimal: 100, watch: 60, risk: 20 };

export const scoreFormula = [
  "A marker in its optimal range scores 100.",
  "A marker in watch scores 60.",
  "A marker in risk scores 20.",
  "A core marker counts two times.",
  "Your score is the weighted mean of these points.",
  "When the report has fewer than half of the core markers, the highest score is 70.",
  "When the report has fewer than a quarter of the core markers, the highest score is 50.",
].join(" ");

function weightedMean(items: Assessed[]): number | null {
  let total = 0;
  let weight = 0;
  for (const { entry, result } of items) {
    if (result.status === "unknown") continue;
    const markerWeight = entry.core ? 2 : 1;
    total += points[result.status] * markerWeight;
    weight += markerWeight;
  }
  return weight ? Math.round(total / weight) : null;
}

function tierFor(score: number): Tier {
  if (score >= 90) return "apex";
  if (score >= 80) return "platinum";
  if (score >= 70) return "gold";
  if (score >= 55) return "silver";
  return "bronze";
}

/**
 * Returns the highest score a panel can reach with this many core markers measured.
 *
 * @remarks
 * Exported so the report page derives `capped` from stored rows without running the engine.
 */
export function coverageCap(measured: number, core: number): number {
  const fraction = measured / core;
  return fraction < 0.25 ? 50 : fraction < 0.5 ? 70 : 100;
}

/**
 * Scores the measured markers and caps the result by core coverage.
 *
 * @remarks
 * A core marker counts as measured when it is on the report, even when its unit is unknown, so coverage reflects the panel and not the extraction.
 */
export function scorePanel(assessed: Assessed[]): Score {
  const measured = assessed.filter(({ entry }) => entry.core).length;
  const core = coreMarkerKeys.length;
  const cap = coverageCap(measured, core);
  const overall = Math.min(weightedMean(assessed) ?? 0, cap);
  const byCategory = Object.fromEntries(
    categorySchema.options.map((category) => [
      category,
      weightedMean(assessed.filter(({ entry }) => entry.category === category)),
    ]),
  ) as Record<Category, number | null>;
  return {
    overall,
    byCategory,
    coverage: { measured, core, pct: Math.round((measured / core) * 100) },
    capped: cap < 100,
    tier: tierFor(overall),
    formula: scoreFormula,
  };
}
