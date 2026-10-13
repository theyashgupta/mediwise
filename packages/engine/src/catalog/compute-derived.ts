import type { Derived, Sex } from "./schema.js";

export type DerivedProfile = { age: number; sex: Sex };

/**
 * Computes a derived marker from values in canonical units, keyed by marker key.
 *
 * @remarks
 * Returns `undefined` when an input is missing or a denominator is zero, so the caller never shows a made-up value.
 * CKD-EPI 2021 is validated for adults only, so eGFR is not computed under 18.
 */
export function computeDerived(
  derived: Derived,
  values: Partial<Record<string, number>>,
  profile?: DerivedProfile,
): number | undefined {
  const { formula } = derived;
  switch (formula.kind) {
    case "ratio": {
      const numerator = values[formula.numerator];
      const denominator = values[formula.denominator];
      if (numerator === undefined || !denominator) return undefined;
      return (numerator / denominator) * (formula.scale ?? 1);
    }
    case "difference": {
      const minuend = values[formula.minuend];
      const subtrahend = values[formula.subtrahend];
      if (minuend === undefined || subtrahend === undefined) return undefined;
      return minuend - subtrahend;
    }
    case "linear": {
      const input = values[formula.input];
      return input === undefined ? undefined : formula.slope * input + formula.intercept;
    }
    case "homa_ir": {
      const glucose = values.glucose_fasting;
      const insulin = values.insulin_fasting;
      if (glucose === undefined || insulin === undefined) return undefined;
      return (glucose * insulin) / 405;
    }
    case "ckd_epi_2021": {
      const creatinine = values.creatinine;
      if (!creatinine || !profile || profile.age < 18) return undefined;
      const female = profile.sex === "female";
      const kappa = female ? 0.7 : 0.9;
      const alpha = female ? -0.241 : -0.302;
      const ratio = creatinine / kappa;
      return (
        142 *
        Math.min(ratio, 1) ** alpha *
        Math.max(ratio, 1) ** -1.2 *
        0.9938 ** profile.age *
        (female ? 1.012 : 1)
      );
    }
    case "bmi": {
      const weight = values.weight;
      const height = values.height;
      if (weight === undefined || !height) return undefined;
      return weight / (height / 100) ** 2;
    }
  }
}
