import { sources } from "../catalog/sources.js";
import type { Pattern, PatternBand } from "../types.js";

const high: PatternBand[] = ["watch_high", "risk_high"];
const low: PatternBand[] = ["watch_low", "risk_low"];
const notLow: PatternBand[] = ["optimal", ...high];

export const patterns: Pattern[] = [
  {
    key: "b12_deficiency",
    name: "B12 deficiency pattern",
    description: "High homocysteine with low or low-normal vitamin B12.",
    conditions: [
      { markerKey: "homocysteine", comparator: "status_is", threshold: high, required: true },
      { markerKey: "vitamin_b12", comparator: "value_below", threshold: 400, required: true },
    ],
    minMatches: 2,
    severity: "risk",
    whatItSuggests:
      "Your body may not get enough vitamin B12. High homocysteine can show a B12 shortage before B12 itself drops low.",
    whatToDo:
      "Speak with your doctor about these values. Ask about a B12 retest or a methylmalonic acid test.",
    askDoctor: [
      "Could my high homocysteine come from low vitamin B12?",
      "Should I have a methylmalonic acid test to check my B12 status?",
    ],
    sources: [sources.bsh2014, sources.refsum2004, sources.yajnik2006],
  },
  {
    key: "iron_deficiency_anaemia",
    name: "Iron deficiency anaemia pattern",
    description: "Low ferritin, low haemoglobin and small red blood cells together.",
    conditions: [
      { markerKey: "ferritin", comparator: "status_is", threshold: low },
      { markerKey: "hemoglobin", comparator: "status_is", threshold: low },
      { markerKey: "mcv", comparator: "status_is", threshold: low },
    ],
    minMatches: 3,
    severity: "risk",
    whatItSuggests:
      "Low iron stores may limit how much haemoglobin your body makes. Small red blood cells often go with low iron.",
    whatToDo: "Speak with your doctor soon. Ask what causes the low iron and how to treat it.",
    askDoctor: [
      "What could cause my low iron stores?",
      "Do I need tests to look for a source of blood loss?",
    ],
    sources: [sources.whoFerritin2020, sources.camaschella2015, sources.aga2020],
  },
  {
    key: "anaemia_of_inflammation",
    name: "Anaemia of inflammation pattern",
    description: "Low haemoglobin with high CRP while ferritin is not low.",
    conditions: [
      { markerKey: "ferritin", comparator: "status_is", threshold: notLow, required: true },
      { markerKey: "hemoglobin", comparator: "status_is", threshold: low, required: true },
      { markerKey: "hs_crp", comparator: "status_is", threshold: high },
      { markerKey: "crp", comparator: "status_is", threshold: high },
    ],
    minMatches: 3,
    severity: "risk",
    whatItSuggests:
      "Inflammation may stop your body from using its iron stores. This can lower haemoglobin even when ferritin is not low.",
    whatToDo:
      "Speak with your doctor about the cause of the inflammation. Ask whether a transferrin saturation test can help.",
    askDoctor: [
      "What could cause the inflammation in my blood tests?",
      "Could inflammation explain my low haemoglobin?",
    ],
    sources: [sources.weiss2005, sources.whoFerritin2020, sources.ahaCdc2003],
  },
  {
    key: "subclinical_hypothyroidism",
    name: "Subclinical hypothyroidism pattern",
    description: "TSH above the range while free T4 stays in the optimal range.",
    conditions: [
      { markerKey: "tsh", comparator: "status_is", threshold: high },
      { markerKey: "free_t4", comparator: "status_is", threshold: ["optimal"] },
    ],
    minMatches: 2,
    severity: "watch",
    whatItSuggests:
      "Your thyroid may need extra signal from TSH to make enough hormone. Free T4 is still in range.",
    whatToDo:
      "Retest TSH and free T4 in 8 to 12 weeks. Ask your doctor whether an anti-TPO antibody test suits you.",
    askDoctor: [
      "My TSH is high but my free T4 is in range. Should we retest in 8 to 12 weeks?",
      "Should I have an anti-TPO antibody test?",
    ],
    sources: [sources.ataAace2012, sources.indiaThyroid2013],
  },
  {
    key: "overt_hypothyroidism",
    name: "Overt hypothyroidism pattern",
    description: "TSH above the range and free T4 below the range.",
    conditions: [
      { markerKey: "tsh", comparator: "status_is", threshold: high },
      { markerKey: "free_t4", comparator: "status_is", threshold: low },
    ],
    minMatches: 2,
    severity: "risk",
    whatItSuggests:
      "Your thyroid may not make enough hormone. This can cause tiredness, weight gain and a cold feeling.",
    whatToDo: "Speak with your doctor soon about these thyroid values.",
    askDoctor: [
      "Could my TSH and free T4 values point to an underactive thyroid?",
      "What should we do next about my thyroid?",
    ],
    sources: [sources.ataAace2012, sources.ata2014],
  },
  {
    key: "hyperthyroidism",
    name: "Hyperthyroidism pattern",
    description: "TSH below the range with free T4 or free T3 above the range.",
    conditions: [
      { markerKey: "tsh", comparator: "status_is", threshold: low, required: true },
      { markerKey: "free_t4", comparator: "status_is", threshold: high },
      { markerKey: "free_t3", comparator: "status_is", threshold: high },
    ],
    minMatches: 2,
    severity: "risk",
    whatItSuggests:
      "Your thyroid may make too much hormone. This can cause a fast heartbeat, weight loss and a hot feeling.",
    whatToDo: "Speak with your doctor soon about these thyroid values.",
    askDoctor: [
      "Could my TSH and thyroid hormone values point to an overactive thyroid?",
      "Which tests can find the cause of my thyroid values?",
    ],
    sources: [sources.ata2016],
  },
  {
    key: "metabolic_lipid_triad",
    name: "Metabolic syndrome lipid triad",
    description: "High triglycerides and low HDL with blood sugar above the optimal range.",
    conditions: [
      { markerKey: "triglycerides", comparator: "status_is", threshold: high, required: true },
      { markerKey: "hdl_cholesterol", comparator: "status_is", threshold: low, required: true },
      { markerKey: "glucose_fasting", comparator: "status_is", threshold: high },
      { markerKey: "hba1c", comparator: "status_is", threshold: high },
    ],
    minMatches: 3,
    severity: "risk",
    whatItSuggests:
      "These values often appear together with insulin resistance. Together they may raise your heart and blood sugar risk.",
    whatToDo:
      "Ask your doctor to check your waist size and blood pressure. These two complete the check for metabolic syndrome.",
    askDoctor: [
      "Should we check my waist size and blood pressure for metabolic syndrome?",
      "How often should I retest my lipids and HbA1c?",
    ],
    sources: [sources.ncepAtp3, sources.misra2009],
  },
  {
    key: "insulin_resistance",
    name: "Insulin resistance signal",
    description: "High HOMA-IR, or a triglyceride to HDL ratio above 3.",
    conditions: [
      { markerKey: "homa_ir", comparator: "status_is", threshold: high },
      {
        markerKey: "triglycerides",
        comparator: "ratio_above",
        denominatorKey: "hdl_cholesterol",
        threshold: 3,
      },
    ],
    minMatches: 1,
    severity: "watch",
    whatItSuggests:
      "Your body may need more insulin than usual to control blood sugar. This often comes before blood sugar rises.",
    whatToDo: "Ask your doctor about a fasting insulin test and an HbA1c retest in 3 months.",
    askDoctor: [
      "Do my values suggest insulin resistance?",
      "Should I have a fasting insulin test with my next HbA1c?",
    ],
    sources: [sources.matthews1985, sources.mclaughlin2003, sources.endukuru2020],
  },
  {
    key: "prediabetes",
    name: "Prediabetes range",
    description: "HbA1c or fasting glucose in the prediabetes range.",
    conditions: [
      { markerKey: "hba1c", comparator: "status_is", threshold: ["watch_high"] },
      { markerKey: "glucose_fasting", comparator: "status_is", threshold: ["watch_high"] },
    ],
    minMatches: 1,
    severity: "watch",
    whatItSuggests:
      "Your blood sugar is above the optimal range but below the diabetes range. Many people in this range can lower it.",
    whatToDo:
      "Retest HbA1c and fasting glucose in 3 to 6 months. Ask your doctor about a plan to lower your blood sugar.",
    askDoctor: ["My blood sugar is in the prediabetes range. How often should I retest it?"],
    sources: [sources.ada2025, sources.icmrDiabetes2018],
  },
  {
    key: "fatty_liver_signal",
    name: "Fatty liver signal",
    description: "High ALT, high GGT and high triglycerides together.",
    conditions: [
      { markerKey: "alt", comparator: "status_is", threshold: high },
      { markerKey: "ggt", comparator: "status_is", threshold: high },
      { markerKey: "triglycerides", comparator: "status_is", threshold: high },
    ],
    minMatches: 3,
    severity: "watch",
    whatItSuggests:
      "Fat may collect in the liver. This pattern often goes with high triglycerides and insulin resistance.",
    whatToDo: "Ask your doctor whether a liver ultrasound suits you.",
    askDoctor: [
      "Could my liver values point to a fatty liver?",
      "Should I have a liver ultrasound?",
    ],
    sources: [sources.aasld2018, sources.acg2017],
  },
  {
    key: "kidney_watch",
    name: "Kidney watch",
    description: "Lower eGFR with albumin in the urine.",
    conditions: [
      { markerKey: "egfr", comparator: "status_is", threshold: low, required: true },
      { markerKey: "urine_acr", comparator: "status_is", threshold: high },
      { markerKey: "urine_albumin", comparator: "status_is", threshold: high },
    ],
    minMatches: 2,
    severity: "watch",
    whatItSuggests:
      "Your kidneys may filter less well than usual. Albumin in the urine can be an early sign of kidney strain.",
    whatToDo: "Retest eGFR and urine ACR in 3 months. Take both reports to your doctor.",
    askDoctor: [
      "Should we retest my eGFR and urine albumin in 3 months?",
      "What could cause albumin in my urine?",
    ],
    sources: [sources.kdigo2024],
  },
  {
    key: "vitamin_d_bone",
    name: "Vitamin D deficiency with bone markers",
    description: "Low vitamin D with a change in calcium, phosphorus, ALP or PTH.",
    conditions: [
      { markerKey: "vitamin_d", comparator: "status_is", threshold: low, required: true },
      { markerKey: "calcium", comparator: "status_is", threshold: low },
      { markerKey: "phosphorus", comparator: "status_is", threshold: low },
      { markerKey: "alp", comparator: "status_is", threshold: high },
      { markerKey: "pth", comparator: "status_is", threshold: high },
    ],
    minMatches: 2,
    severity: "watch",
    whatItSuggests:
      "Low vitamin D may change how your body uses calcium. The bone markers suggest that the shortage may affect bone.",
    whatToDo:
      "Speak with your doctor about vitamin D treatment. Retest vitamin D and calcium in 3 months.",
    askDoctor: [
      "Do my bone markers show an effect of low vitamin D?",
      "When should I retest vitamin D and calcium?",
    ],
    sources: [sources.endoVitD2011, sources.iomVitD2011],
  },
  {
    key: "haemoconcentration",
    name: "Dehydration or haemoconcentration signal",
    description: "High haematocrit with high urea.",
    conditions: [
      { markerKey: "hematocrit", comparator: "status_is", threshold: high, required: true },
      { markerKey: "blood_urea", comparator: "status_is", threshold: high },
      { markerKey: "bun", comparator: "status_is", threshold: high },
    ],
    minMatches: 2,
    severity: "watch",
    whatItSuggests:
      "Low fluid intake before the test may make the blood more concentrated. This can raise haematocrit and urea together.",
    whatToDo:
      "Drink water as usual before your next test. Retest haematocrit and urea to see if the values change.",
    askDoctor: ["Could low fluid intake explain my high haematocrit and urea?"],
    sources: [sources.dacie2017, sources.tietz2022],
  },
  {
    key: "inflammation_signal",
    name: "Inflammation signal",
    description: "High CRP with a high ESR.",
    conditions: [
      { markerKey: "esr", comparator: "status_is", threshold: high, required: true },
      { markerKey: "hs_crp", comparator: "status_is", threshold: high },
      { markerKey: "crp", comparator: "status_is", threshold: high },
    ],
    minMatches: 2,
    severity: "watch",
    whatItSuggests:
      "Two separate markers show inflammation in the body. A recent infection or injury can raise both.",
    whatToDo:
      "Retest CRP and ESR in 2 to 4 weeks if you feel well. Speak with your doctor if the values stay high.",
    askDoctor: [
      "What could cause the inflammation in my blood tests?",
      "When should I retest CRP and ESR?",
    ],
    sources: [sources.ahaCdc2003, sources.dacie2017],
  },
  {
    key: "gout_risk",
    name: "Gout risk",
    description: "Uric acid above the optimal range.",
    conditions: [{ markerKey: "uric_acid", comparator: "status_is", threshold: high }],
    minMatches: 1,
    severity: "watch",
    whatItSuggests:
      "High uric acid can form crystals in the joints. It also often goes with high blood pressure and insulin resistance.",
    whatToDo:
      "Retest uric acid in 3 months. Speak with your doctor if a joint becomes painful or swollen.",
    askDoctor: ["My uric acid is high. What is my risk of gout?"],
    sources: [sources.acrGout2020, sources.eularGout2016],
  },
];

const measured = (markerKey: string) => ({ markerKey, comparator: "measured" as const });

export const links: Pattern[] = [
  {
    key: "fatty_liver_on_scan",
    name: "Fatty liver on the scan",
    description:
      "The scan shows a fatty liver. The same visit measured liver, lipid or sugar markers.",
    study: { kinds: ["ultrasound", "ct", "mri"], says: "fatty (liver|infiltration)|steatosis" },
    conditions: ["alt", "ast", "ggt", "triglycerides", "hba1c", "glucose_fasting"].map(measured),
    minMatches: 1,
    severity: "watch",
    whatItSuggests:
      "A fatty liver often goes with high triglycerides and high blood sugar. ALT can rise when liver cells are under strain.",
    whatToDo:
      "Speak with your doctor about the scan result. Ask which liver and sugar tests to repeat.",
    askDoctor: ["My scan shows a fatty liver. Which tests should I repeat, and when?"],
    sources: [sources.aasld2023, sources.masld2023],
  },
  {
    key: "kidney_stone_on_scan",
    name: "Kidney stone on the scan",
    description:
      "The scan shows a kidney stone. The same visit measured kidney, uric acid or calcium markers.",
    study: {
      kinds: ["ultrasound", "xray", "ct"],
      says: "nephrolith|urolith|(renal|kidney|ureteric) (calcul|stone)",
    },
    conditions: ["creatinine", "uric_acid", "calcium"].map(measured),
    minMatches: 1,
    severity: "watch",
    whatItSuggests:
      "High uric acid or high calcium can help form kidney stones. Creatinine shows how well the kidneys filter.",
    whatToDo:
      "Speak with your doctor about the scan result. Ask whether a urine test for stone risk can help.",
    askDoctor: ["My scan shows a kidney stone. Do my uric acid and calcium values explain it?"],
    sources: [sources.eauUrolithiasis2024],
  },
];
