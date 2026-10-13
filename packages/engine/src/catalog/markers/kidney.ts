import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { clevelandDkd2026, kdigo2024, tietz2022 } = sources;

export const kidneyMarkers: Marker[] = [
  {
    key: "creatinine",
    name: "Creatinine",
    aliases: [
      "serum creatinine",
      "s creatinine",
      "sr creatinine",
      "creatinine serum",
      "creat",
      "creatinine blood",
      "plasma creatinine",
    ],
    category: "kidney",
    unit: "mg/dL",
    conversions: [{ from: "µmol/L", factor: 0.01131 }],
    precision: 2,
    description: "A muscle waste product that shows how well kidneys filter.",
    whatItIs:
      "Creatinine is a waste product of normal muscle activity, and the kidneys clear it from blood. Combined with age and sex it gives the eGFR, the standard estimate of kidney function.",
    whyItMatters:
      "A rising creatinine means the kidneys filter less. Kidney decline is silent until late, so this value is the early warning.",
    whatMovesIt:
      "More muscle, heavy workouts, high meat or creatine intake and dehydration raise it. Low muscle mass lowers it, which can make kidneys look better than they are.",
    ranges: [
      range(tietz2022, [0.7, 1.3], [0.6, 1.5], { sex: "male" }),
      range(tietz2022, [0.6, 1.1], [0.5, 1.3], { sex: "female" }),
    ],
    sources: [tietz2022, kdigo2024],
    core: true,
    direction: "both",
  },
  {
    key: "blood_urea",
    name: "Urea",
    aliases: ["urea", "serum urea", "s urea", "urea serum", "blood urea serum", "plasma urea"],
    category: "kidney",
    unit: "mg/dL",
    conversions: [{ from: "mmol/L", factor: 6.006 }],
    precision: 0,
    description: "A protein waste product that the kidneys clear.",
    whatItIs:
      "The liver makes urea from protein breakdown, and the kidneys remove it. Indian labs usually report urea, while US labs report urea nitrogen.",
    whyItMatters:
      "A high urea can reflect lower kidney function, dehydration or a high protein intake. It is less specific than creatinine, so doctors interpret the two together.",
    whatMovesIt:
      "Dehydration, high protein meals, gut bleeding and steroids raise it. Low protein intake and liver disease lower it.",
    ranges: [range(tietz2022, [15, 40], [10, 50])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "bun",
    name: "Blood urea nitrogen",
    shortName: "BUN",
    aliases: [
      "blood urea nitrogen",
      "urea nitrogen",
      "serum bun",
      "bun serum",
      "serum urea nitrogen",
    ],
    category: "kidney",
    unit: "mg/dL",
    conversions: [{ from: "mmol/L", factor: 2.801 }],
    precision: 1,
    description: "The nitrogen part of urea, a kidney and hydration marker.",
    whatItIs:
      "BUN measures the nitrogen within urea, so it is urea expressed differently. Urea in mg/dL is about 2.14 times BUN.",
    whyItMatters:
      "Like urea, a high BUN can mean dehydration, high protein intake or reduced kidney function. The BUN to creatinine ratio helps distinguish these.",
    whatMovesIt:
      "Dehydration, protein-rich diets, gut bleeding and steroids raise it. Low protein intake and liver disease lower it.",
    ranges: [range(tietz2022, [7, 20], [5, 25])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "cystatin_c",
    name: "Cystatin C",
    aliases: ["cystatin", "serum cystatin c", "cys c", "cystatin c serum"],
    category: "kidney",
    unit: "mg/L",
    conversions: [],
    precision: 2,
    description: "A kidney filtration marker that muscle mass does not affect.",
    whatItIs:
      "Cystatin C is a small protein that all cells make at a steady rate. The kidneys clear it. Unlike creatinine, it does not depend on muscle mass.",
    whyItMatters:
      "KDIGO 2024 recommends cystatin C to confirm kidney function when creatinine may mislead. Examples are very muscular or very lean people. A high value means reduced filtering.",
    whatMovesIt:
      "Reduced kidney function raises it. Thyroid imbalance, steroids and inflammation can shift it a little.",
    ranges: [range(tietz2022, [null, 1.0], [null, 1.2])],
    sources: [tietz2022, kdigo2024],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_albumin",
    name: "Urine albumin",
    aliases: [
      "urine microalbumin",
      "microalbumin",
      "micro albumin",
      "urinary albumin",
      "albumin urine",
      "microalbumin urine",
    ],
    category: "kidney",
    unit: "mg/L",
    conversions: [{ from: "mg/dL", factor: 10 }],
    precision: 1,
    description: "Small amounts of albumin leaking into urine.",
    whatItIs:
      "Healthy kidneys keep albumin in the blood, so urine has very little. This test measures the concentration of albumin in a urine sample.",
    whyItMatters:
      "Albumin in urine is one of the earliest signs of kidney damage from diabetes or high blood pressure. A concentration depends on how dilute the urine is, so the albumin to creatinine ratio is more reliable.",
    whatMovesIt:
      "High sugar, high blood pressure, hard exercise, fever and urine infection raise it. Controlling sugar and blood pressure lowers it.",
    ranges: [range(tietz2022, [null, 19], [null, 200])],
    sources: [tietz2022, kdigo2024],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_creatinine",
    name: "Urine creatinine",
    aliases: ["creatinine urine", "urinary creatinine", "urine creat", "spot urine creatinine"],
    category: "kidney",
    unit: "mg/dL",
    conversions: [{ from: "mmol/L", factor: 11.31 }],
    precision: 1,
    description: "Creatinine in urine, used to correct for how dilute it is.",
    whatItIs:
      "Urine creatinine is the creatinine concentration in a urine sample. Labs use it to correct other urine values for how concentrated the sample is.",
    whyItMatters:
      "On its own it says little about health. It makes the albumin to creatinine ratio possible, which is the reliable urine kidney test.",
    whatMovesIt:
      "Fluid intake changes it within hours. Muscle mass and meat intake set its usual level.",
    ranges: [range(tietz2022, [20, 300], [10, 400])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "urine_acr",
    name: "Urine albumin to creatinine ratio",
    shortName: "ACR",
    aliases: [
      "acr",
      "uacr",
      "albumin creatinine ratio",
      "urine albumin creatinine ratio",
      "microalbumin creatinine ratio",
      "urine microalbumin creatinine ratio",
      "albumin creatinine ratio urine",
    ],
    category: "kidney",
    unit: "mg/g",
    conversions: [{ from: "mg/mmol", factor: 8.84 }],
    precision: 1,
    description: "The standard urine test for early kidney damage.",
    whatItIs:
      "ACR divides urine albumin by urine creatinine, which corrects for how dilute the sample is. It is the urine test KDIGO uses to stage kidney disease.",
    whyItMatters:
      "KDIGO calls under 30 mg/g normal, 30 to 300 moderately increased and above 300 severely increased. A raised ACR predicts kidney decline and heart disease even when eGFR is normal.",
    whatMovesIt:
      "High sugar, high blood pressure, smoking, fever and hard exercise raise it. Sugar and blood pressure control and some blood pressure medicines lower it.",
    ranges: [range(kdigo2024, [null, 29], [null, 300])],
    retest: [
      { status: "watch", weeks: 52, source: clevelandDkd2026.id },
      { status: "risk", weeks: 52, source: clevelandDkd2026.id },
    ],
    sources: [kdigo2024, clevelandDkd2026],
    core: false,
    direction: "high_is_bad",
  },
];
