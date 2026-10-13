import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const {
  aafpAda2018,
  ada2025,
  icmrDiabetes2018,
  icmrIndiab2023,
  misra2009,
  tietz2022,
  usPharmacistAda2022,
} = sources;

const glucoseConversions = [{ from: "mmol/L", factor: 18.016 }];

export const metabolicMarkers: Marker[] = [
  {
    key: "glucose_fasting",
    name: "Fasting glucose",
    shortName: "FBS",
    aliases: [
      "fasting blood sugar",
      "fbs",
      "fbg",
      "fpg",
      "fasting plasma glucose",
      "glucose fasting",
      "fasting glucose",
      "blood sugar fasting",
      "plasma glucose fasting",
      "fasting blood glucose",
    ],
    category: "metabolic",
    unit: "mg/dL",
    conversions: glucoseConversions,
    precision: 0,
    description: "Your blood sugar after at least eight hours without food.",
    whatItIs:
      "Fasting glucose is the sugar level in your blood after an overnight fast of at least eight hours. It reflects how well the body keeps sugar steady without food.",
    whyItMatters:
      "By ADA criteria, 100 to 125 mg/dL is prediabetes, and 126 or above on two tests is diabetes. Catching the rise early gives years to reverse it.",
    whatMovesIt:
      "Weight around the waist, inactivity, poor sleep and refined carbohydrates raise it. Regular exercise, weight loss and steady sleep lower it. Steroids or acute illness can raise it for a while.",
    ranges: [range(ada2025, [70, 99], [54, 125])],
    southAsianNote:
      "Diabetes is common and starts early in India. ICMR-INDIAB found diabetes in 11.4% and prediabetes in 15.3% of adults. The diagnostic cut-offs are the same, so MediWise uses the same range here.",
    sources: [ada2025, icmrIndiab2023, icmrDiabetes2018],
    core: true,
    direction: "both",
  },
  {
    key: "glucose_postprandial",
    name: "Post-meal glucose",
    shortName: "PPBS",
    aliases: [
      "ppbs",
      "pp blood sugar",
      "post prandial blood sugar",
      "postprandial blood sugar",
      "glucose pp",
      "glucose post prandial",
      "plasma glucose pp",
      "blood sugar pp",
      "2 hour post prandial glucose",
      "ppbg",
    ],
    category: "metabolic",
    unit: "mg/dL",
    conversions: glucoseConversions,
    precision: 0,
    description: "Your blood sugar two hours after a meal.",
    whatItIs:
      "The lab measures post-meal glucose two hours after you start eating. It shows how quickly the body clears sugar from a real meal.",
    whyItMatters:
      "A high value can appear years before fasting glucose rises. ADA uses 140 mg/dL at two hours as the upper limit of normal. On a glucose load test, ADA uses 200 as the diabetes threshold.",
    whatMovesIt:
      "Meal size, refined carbohydrates and inactivity raise it. A short walk after meals, more fibre and protein, and weight loss lower it.",
    ranges: [range(ada2025, [70, 139], [54, 199])],
    southAsianNote:
      "Indian adults often show high post-meal sugar while fasting sugar still looks normal, partly because of rice- and wheat-heavy meals. ICMR guidance recommends checking both.",
    sources: [ada2025, icmrDiabetes2018],
    core: false,
    direction: "both",
  },
  {
    key: "glucose_random",
    name: "Random glucose",
    shortName: "RBS",
    aliases: [
      "rbs",
      "random blood sugar",
      "glucose random",
      "random plasma glucose",
      "blood sugar random",
      "rbg",
    ],
    category: "metabolic",
    unit: "mg/dL",
    conversions: glucoseConversions,
    precision: 0,
    description: "Your blood sugar at any time of day, regardless of meals.",
    whatItIs:
      "The lab measures random glucose without regard to when you last ate. It is a quick snapshot rather than a controlled test.",
    whyItMatters:
      "With symptoms such as thirst and frequent urination, 200 mg/dL or more meets the ADA definition of diabetes. Lower values are hard to read without knowing the meal timing.",
    whatMovesIt:
      "The last meal, stress, illness and medicines move it within hours. Long-term habits move the baseline it sits on.",
    ranges: [range(ada2025, [70, 139], [54, 199])],
    sources: [ada2025],
    core: false,
    direction: "both",
  },
  {
    key: "hba1c",
    name: "HbA1c",
    shortName: "HbA1c",
    aliases: [
      "glycated hemoglobin",
      "glycated haemoglobin",
      "glycosylated hemoglobin",
      "glycosylated haemoglobin",
      "hb a1c",
      "a1c",
      "hemoglobin a1c",
      "haemoglobin a1c",
      "glyco hb",
      "hba1c result",
      "hba1c ifcc",
      "glycated hemoglobin ifcc",
      "glycated haemoglobin ifcc",
      "glycosylated hemoglobin ifcc",
      "glycosylated haemoglobin ifcc",
    ],
    category: "metabolic",
    unit: "%",
    conversions: [{ from: "mmol/mol", factor: 0.09148, offset: 2.152 }],
    precision: 1,
    description: "Your average blood sugar over the last two to three months.",
    whatItIs:
      "HbA1c is the share of hemoglobin that has sugar stuck to it. Because red cells live about three months, it reflects average sugar over that time.",
    whyItMatters:
      "By ADA criteria, 5.7% to 6.4% is prediabetes and 6.5% or above is diabetes. It does not need fasting, which makes it the most practical long-term sugar measure.",
    whatMovesIt:
      "Diet, activity, weight and sleep move it over months. Iron deficiency anaemia can make the value falsely high. Recent blood loss or some hemoglobin variants can make it falsely low.",
    ranges: [range(ada2025, [null, 5.6], [null, 6.4])],
    retest: [
      { status: "watch", weeks: 52, source: aafpAda2018.id },
      { status: "risk", weeks: 13, source: usPharmacistAda2022.id },
    ],
    southAsianNote:
      "South Asians develop diabetes at a lower body weight, so ADA advises screening Asian Americans from a BMI of 23. Iron deficiency is common in India and can raise HbA1c, so read it with hemoglobin.",
    sources: [ada2025, icmrIndiab2023, icmrDiabetes2018, aafpAda2018, usPharmacistAda2022],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "insulin_fasting",
    name: "Fasting insulin",
    aliases: [
      "insulin fasting",
      "fasting insulin",
      "serum insulin fasting",
      "insulin",
      "fasting serum insulin",
    ],
    category: "metabolic",
    unit: "µIU/mL",
    conversions: [
      { from: "pmol/L", factor: 0.1667 },
      { from: "mIU/L", factor: 1 },
    ],
    precision: 1,
    description: "How much insulin your body needs to keep fasting sugar steady.",
    whatItIs:
      "Insulin is the hormone that moves sugar from blood into cells. Fasting insulin shows how hard the pancreas works to hold fasting sugar in range.",
    whyItMatters:
      "High fasting insulin with normal sugar is an early sign of insulin resistance, often years before prediabetes. Combined with glucose it gives HOMA-IR.",
    whatMovesIt:
      "Belly fat, inactivity, poor sleep and frequent snacking raise it. Strength and aerobic training, weight loss and fewer refined carbohydrates lower it.",
    ranges: [range(tietz2022, [2, 12], [2, 25])],
    southAsianNote:
      "Asian Indians tend to have more insulin resistance than Europeans at the same body weight. The Indian consensus on obesity and metabolic syndrome describes this pattern. No source publishes a separate insulin range, so MediWise uses the same range here.",
    sources: [tietz2022, misra2009],
    core: true,
    direction: "both",
  },
  {
    key: "c_peptide",
    name: "C-peptide",
    aliases: ["c peptide", "c peptide fasting", "fasting c peptide", "connecting peptide"],
    category: "metabolic",
    unit: "ng/mL",
    conversions: [
      { from: "nmol/L", factor: 3.02 },
      { from: "pmol/L", factor: 0.00302 },
    ],
    precision: 2,
    description: "A by-product of insulin that shows how much insulin you make.",
    whatItIs:
      "The pancreas releases C-peptide in equal amounts with insulin when it makes insulin. It stays in blood longer than insulin, so it is a steadier measure of insulin output.",
    whyItMatters:
      "A low value means the pancreas makes little insulin, as in type 1 diabetes. A high value is usually linked with insulin resistance.",
    whatMovesIt:
      "Insulin resistance and recent food raise it. Kidney disease raises it because the kidneys clear it.",
    ranges: [range(tietz2022, [0.8, 3.1], [0.5, 4.0])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "fructosamine",
    name: "Fructosamine",
    aliases: [
      "serum fructosamine",
      "fructosamine serum",
      "glycated serum protein",
      "s fructosamine",
    ],
    category: "metabolic",
    unit: "µmol/L",
    conversions: [],
    precision: 0,
    description: "Your average blood sugar over the last two to three weeks.",
    whatItIs:
      "Fructosamine measures sugar attached to blood proteins, mostly albumin. Because the body replaces these proteins faster than red cells, it reflects the last two to three weeks.",
    whyItMatters:
      "It is useful when HbA1c is unreliable, as in anaemia or hemoglobin variants, or when treatment changed recently. Higher values mean higher recent sugar.",
    whatMovesIt:
      "Recent sugar control moves it within weeks. Low albumin, as in kidney or liver disease, can make the value falsely low.",
    ranges: [range(tietz2022, [null, 285], [null, 320])],
    sources: [tietz2022, ada2025],
    core: false,
    direction: "high_is_bad",
  },
];
