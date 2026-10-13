import { computeDerived, derived, type Formula } from "./catalog/index.js";
import { round } from "./normalise.js";
import { assess, type Assessed } from "./status.js";
import type { DerivedResult, EngineProfile } from "./types.js";

function formulaInputs(formula: Formula): string[] {
  switch (formula.kind) {
    case "ratio":
      return [formula.numerator, formula.denominator];
    case "difference":
      return [formula.minuend, formula.subtrahend];
    case "linear":
      return [formula.input];
    case "homa_ir":
      return ["glucose_fasting", "insulin_fasting"];
    case "ckd_epi_2021":
      return ["creatinine"];
    case "bmi":
      return ["weight", "height"];
  }
}

/**
 * Computes every derived marker the panel has inputs for and gives it a status.
 *
 * @remarks
 * A derived value the lab printed stays in `markers` and is not computed again. Catalog order puts globulin before the albumin to globulin ratio, so chained formulas see their input.
 */
export function deriveMarkers(assessed: Assessed[], profile: EngineProfile): DerivedResult[] {
  const onReport = new Set(assessed.map(({ entry }) => entry.key));
  const values: Record<string, number> = {};
  for (const { entry, result } of assessed) {
    if (result.unit === entry.unit && typeof result.value === "number") {
      values[entry.key] = result.value;
    }
  }
  const sexed = profile.sex === "other" ? undefined : { age: profile.ageYears, sex: profile.sex };

  const results: DerivedResult[] = [];
  for (const entry of derived) {
    if (onReport.has(entry.key)) continue;
    const raw = computeDerived(entry, values, sexed);
    if (raw === undefined) continue;
    const value = round(raw, entry.precision);
    values[entry.key] = value;
    const { result } = assess({ entry, value, unit: entry.unit, canonical: true }, profile);
    results.push({ ...result, inputs: formulaInputs(entry.formula) });
  }
  return results;
}
