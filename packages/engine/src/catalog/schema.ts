import { z } from "zod";

export const categorySchema = z.enum([
  "metabolic",
  "lipids",
  "inflammation",
  "kidney",
  "liver",
  "thyroid",
  "vitamins",
  "iron",
  "blood_count",
  "electrolytes",
  "urate",
  "cardiac",
  "hormones",
  "bone",
  "urine",
  "vitals",
  "studies",
  "other",
]);
export type Category = z.infer<typeof categorySchema>;

export const ancestrySchema = z.enum([
  "south_asian",
  "east_asian",
  "african",
  "european",
  "hispanic",
  "middle_eastern",
  "other",
]);
export type Ancestry = z.infer<typeof ancestrySchema>;

export const sexSchema = z.enum(["male", "female"]);
export type Sex = z.infer<typeof sexSchema>;

export const directionSchema = z.enum(["high_is_bad", "low_is_bad", "both"]);
export type Direction = z.infer<typeof directionSchema>;

export const intervalSchema = z
  .tuple([z.number().nullable(), z.number().nullable()])
  .refine(([low, high]) => low !== null || high !== null, "an interval needs at least one bound")
  .refine(([low, high]) => low === null || high === null || low < high, "low must be below high");
export type Interval = z.infer<typeof intervalSchema>;

export const rangeSchema = z
  .object({
    sex: sexSchema.optional(),
    ageMin: z.number().nonnegative().optional(),
    ageMax: z.number().positive().optional(),
    ancestry: ancestrySchema.optional(),
    optimal: intervalSchema,
    watch: intervalSchema,
    source: z.string().min(1),
  })
  .refine(
    ({ optimal, watch }) =>
      (watch[0] === null || (optimal[0] !== null && watch[0] <= optimal[0])) &&
      (watch[1] === null || (optimal[1] !== null && watch[1] >= optimal[1])),
    "watch must contain optimal",
  )
  .refine(
    ({ ageMin, ageMax }) => ageMin === undefined || ageMax === undefined || ageMin < ageMax,
    "ageMin must be below ageMax",
  );
export type Range = z.infer<typeof rangeSchema>;

export const sourceSchema = z.object({
  id: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  title: z.string().min(1),
  year: z.number().int().min(1950).max(2100),
  url: z.url().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const conversionSchema = z.object({
  from: z.string().min(1),
  factor: z.number().positive(),
  offset: z.number().optional(),
});
export type Conversion = z.infer<typeof conversionSchema>;

export const textRuleSchema = z
  .object({
    pattern: z.string().min(1),
    status: z.enum(["optimal", "watch", "risk"]),
    followUp: z
      .object({ title: z.string().min(1), why: z.string().min(1), next: z.string().min(1) })
      .optional(),
  })
  .refine(
    ({ status, followUp }) => status !== "risk" || followUp !== undefined,
    "a risk rule needs a follow-up",
  );
export type TextRule = z.infer<typeof textRuleSchema>;

export const retestSchema = z.object({
  status: z.enum(["watch", "risk"]),
  weeks: z.number().int().positive(),
  source: z.string().min(1),
});
export type Retest = z.infer<typeof retestSchema>;

export const markerSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/),
  name: z.string().min(1),
  shortName: z.string().min(1).optional(),
  aliases: z.array(z.string().min(1)),
  category: categorySchema,
  unit: z.string().min(1),
  conversions: z.array(conversionSchema),
  precision: z.number().int().min(0).max(3),
  description: z.string().min(1).max(89),
  whatItIs: z.string().min(1),
  whyItMatters: z.string().min(1),
  whatMovesIt: z.string().min(1),
  ranges: z.array(rangeSchema),
  textRules: z.array(textRuleSchema).optional(),
  retest: z.array(retestSchema).optional(),
  southAsianNote: z.string().min(1).optional(),
  sources: z.array(sourceSchema).min(1),
  core: z.boolean(),
  supplementable: z.boolean().optional(),
  direction: directionSchema,
});
export type Marker = z.infer<typeof markerSchema>;

const adviceLines = z.array(z.string().min(1)).min(1).max(3);

export const lifestyleSchema = z.object({
  side: z.enum(["high", "low"]),
  habits: adviceLines,
  raises: adviceLines,
  lowers: adviceLines,
  source: z.string().min(1),
});
export type Lifestyle = z.infer<typeof lifestyleSchema>;

const limitSchema = z.object({ value: z.number(), source: z.string().min(1) });

export const urgentLimitSchema = z
  .object({ below: limitSchema.optional(), above: limitSchema.optional() })
  .refine(({ below, above }) => below || above, "an urgent limit needs below or above");
export type UrgentLimit = z.infer<typeof urgentLimitSchema>;

export const formulaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ratio"),
    numerator: z.string(),
    denominator: z.string(),
    scale: z.number().positive().optional(),
  }),
  z.object({ kind: z.literal("difference"), minuend: z.string(), subtrahend: z.string() }),
  z.object({
    kind: z.literal("linear"),
    input: z.string(),
    slope: z.number(),
    intercept: z.number(),
  }),
  z.object({ kind: z.literal("homa_ir") }),
  z.object({ kind: z.literal("ckd_epi_2021") }),
  z.object({ kind: z.literal("bmi") }),
]);
export type Formula = z.infer<typeof formulaSchema>;

export const derivedSchema = markerSchema.extend({ formula: formulaSchema });
export type Derived = z.infer<typeof derivedSchema>;
