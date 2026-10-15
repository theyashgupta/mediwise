import { expect, test } from "vitest";
import { findMarker } from "./index.js";
import { normalizeName } from "./find-marker.js";

test("normalizeName lower-cases, strips punctuation and unit parentheses, and collapses spaces", () => {
  expect(normalizeName("  S. CREATININE (mg/dL) ")).toBe("s creatinine");
  expect(normalizeName("Glucose (Fasting)")).toBe("glucose fasting");
  expect(normalizeName("IG%")).toBe("ig percent");
  expect(normalizeName("Glycémie à jeun")).toBe("glycemie a jeun");
});

test.each([
  ["Glycémie à jeun", "glucose_fasting"],
  ["Glukose nüchtern", "glucose_fasting"],
  ["Glucosa en ayunas", "glucose_fasting"],
  ["Urée", "blood_urea"],
  ["Harnstoff", "blood_urea"],
  ["Ureum", "blood_urea"],
  ["Urea", "blood_urea"],
  ["BUN", "bun"],
  ["Urea Nitrogen", "bun"],
  ["Urea Nitrogen (BUN)", "bun"],
  ["Blood Urea Nitrogen", "bun"],
  ["Natrium", "sodium"],
  ["Kalium", "potassium"],
  ["ALAT", "alt"],
  ["GPT", "alt"],
  ["TGP", "alt"],
  ["SGPT", "alt"],
  ["ASAT", "ast"],
  ["GOT", "ast"],
  ["TGO", "ast"],
  ["SGOT", "ast"],
  ["Hemoglobin A1c", "hba1c"],
  ["A1c", "hba1c"],
  ["Glycated hemoglobin", "hba1c"],
  ["Glycohemoglobin", "hba1c"],
  ["HbA1c (IFCC)", "hba1c"],
  ["Hemoglobin", "hemoglobin"],
  ["Haemoglobin", "hemoglobin"],
  ["Hämoglobin", "hemoglobin"],
  ["Hémoglobine", "hemoglobin"],
  ["25-Hydroxy vitamin D", "vitamin_d"],
  ["VITAMIN D, 25-OH, TOTAL", "vitamin_d"],
  ["TSH 3rd generation", "tsh"],
  ["Kreatinin", "creatinine"],
  ["White cell count", "wbc_count"],
])("international name %j resolves to %s", (raw, key) => {
  expect(findMarker(raw)?.key).toBe(key);
});

test.each([
  "CBC",
  "FBC",
  "Blutbild",
  "NFS",
  "Hemograma",
  "Emocromo",
  "U&E",
  "BMP",
  "CMP",
  "LFT",
  "Hepatic function panel",
  "Lipid panel",
  "Glucose",
  "Glukose",
  "Glycemie",
  "Glucosa",
  "Glicemia",
])("panel name or bare glucose word %j maps to no marker", (raw) => {
  expect(findMarker(raw)).toBeUndefined();
});

test.each([
  ["Vitamin B12 (Cyanocobalamin)", "vitamin_b12"],
  ["S. CREATININE", "creatinine"],
  ["HbA1c - Glycated Hemoglobin", "hba1c"],
  ["Glucose (Fasting)", "glucose_fasting"],
  ["Hemoglobin (g/dL)", "hemoglobin"],
  ["Serum Uric Acid", "uric_acid"],
  ["HCT %", "hematocrit"],
  ["Immature Granulocyte Percentage (IG%)", "immature_granulocytes_pct"],
  ["Immature Granulocytes (IG)", "immature_granulocytes_abs"],
  ["SGOT/SGPT Ratio", "ast_alt_ratio"],
  ["25-OH Vitamin D (Total)", "vitamin_d"],
  ["Platelet Count", "platelet_count"],
])("findMarker(%j) resolves to %s", (raw, key) => {
  expect(findMarker(raw)?.key).toBe(key);
});

test.each([
  ["HBsAg", "hbsag"],
  ["HCV, IgG", "hcv_antibody"],
  ["Anti Hbs Titre", "anti_hbs"],
  ["Urine Colour", "urine_colour"],
  ["Crystals", "urine_crystals"],
  ["Peripheral Smear Examination - RBC", "smear_rbc"],
  ["Peripheral Smear Examination - WBC", "smear_wbc"],
  ["Peripheral Smear Examination - DLC", "smear_dlc"],
  ["Peripheral Smear Examination - Platelets", "smear_platelets"],
  ["Peripheral Smear Examination - Hemoparasite", "smear_hemoparasite"],
  ["RBC (Peripheral Smear)", "smear_rbc"],
  ["WBC (Peripheral Smear)", "smear_wbc"],
  ["DLC (Peripheral Smear)", "smear_dlc"],
  ["Platelets (Peripheral Smear)", "smear_platelets"],
  ["Hemoparasite (Peripheral Smear)", "smear_hemoparasite"],
  ["Apolipoprotein (A)", "apolipoprotein_a1"],
  ["Glycosylated Haemoglobin(Hb A1c) IFCC", "hba1c"],
  ["R.B.C. Count", "rbc_count"],
  ["Mean Cell Hb Conc(MCHC)", "mchc"],
  ["HbA1c Result", "hba1c"],
  ["Estimated Mean Blood Glucose", "estimated_average_glucose"],
  ["Saturation Index", "transferrin_saturation"],
  ["Cholesterol/HDL Chol. Ratio", "tc_hdl_ratio"],
  ["LDL CHOL/ HDL CHOL RATIO", "ldl_hdl_ratio"],
  ["Triiodothyronine (T3)", "total_t3"],
  ["Thyroxine (T4)", "total_t4"],
  ["Free T3", "free_t3"],
  ["C-Reactive Protein", "crp"],
  ["HIGH SENSITIVITY C-REACTIVE PROTEIN (HS-CRP)", "hs_crp"],
])("the sample report name %j resolves to %s", (raw, key) => {
  expect(findMarker(raw)?.key).toBe(key);
});

const bloodPanel = "Complete Haemogram, Peripheral Smear and ESR,EDTA";
const liverPanel = "Liver Function Test (LFT)*, Serum";
const urinePanel = "Urine Routine And Microscopy*";

test.each([
  ["RBC Count", bloodPanel, "rbc_count"],
  ["Haemoglobin", bloodPanel, "hemoglobin"],
  ["Bilirubin (Total)", liverPanel, "bilirubin_total"],
  ["Albumin", liverPanel, "albumin"],
  ["Colour", urinePanel, "urine_colour"],
  ["PH", urinePanel, "urine_ph"],
  ["Specific Gravity", urinePanel, "urine_specific_gravity"],
  ["Protein", urinePanel, "urine_protein"],
  ["Glucose.", urinePanel, "urine_glucose"],
  ["Ketones", urinePanel, "urine_ketones"],
  ["Blood", urinePanel, "urine_blood"],
  ["Bilirubin", urinePanel, "urine_bilirubin"],
  ["Urobilinogen", urinePanel, "urine_urobilinogen"],
  ["Nitrite", urinePanel, "urine_nitrite"],
  ["Red Blood Cells (RBC)", urinePanel, "urine_rbc"],
  ["White Blood Cells", urinePanel, "urine_pus_cells"],
  ["Squamous Epithelial Cells", urinePanel, "urine_epithelial_cells"],
  ["Cast", urinePanel, "urine_casts"],
  ["Crystals", urinePanel, "urine_crystals"],
  ["Bacteria", urinePanel, "urine_bacteria"],
  ["W.B.C. (Pus Cells)", "URINE ROUTINE", "urine_pus_cells"],
  ["Albumin, Urine", "Albumin /Creatinine Ratio, Urine *", "urine_albumin"],
  ["Creatinine, Urine", "Albumin /Creatinine Ratio, Urine *", "urine_creatinine"],
  ["Albumin/Creatinine Ratio", "Albumin /Creatinine Ratio, Urine *", "urine_acr"],
])("the sample report line %j in panel %j resolves to %s", (raw, panel, key) => {
  expect(findMarker(raw, panel)?.key).toBe(key);
});

test.each([
  ["RBC", "smear_rbc"],
  ["WBC", "smear_wbc"],
  ["Platelets", "smear_platelets"],
  ["Peripheral Smear RBC", "smear_rbc"],
  ["Peripheral Smear - WBC", "smear_wbc"],
  ["Peripheral Smear Platelets", "smear_platelets"],
])("a text finding %j under a heading with a smear resolves to %s", (raw, key) => {
  expect(findMarker(raw, bloodPanel, "Normocytic normochromic")?.key).toBe(key);
});

test("a number under a heading with a smear keeps its count marker", () => {
  expect(findMarker("RBC", bloodPanel, 5.53)?.key).toBe("rbc_count");
  expect(findMarker("Platelets", bloodPanel, 250)?.key).toBe("platelet_count");
});

test("a text finding under a heading without a smear keeps its count marker", () => {
  expect(findMarker("RBC", "Complete Blood Count", "Normocytic normochromic")?.key).toBe(
    "rbc_count",
  );
});

test("a urine panel name with no urine entry stays unmapped instead of taking a blood marker", () => {
  expect(findMarker("Haemoglobin")?.key).toBe("hemoglobin");
  expect(findMarker("Platelet Count", urinePanel)).toBeUndefined();
});

test("HDL/LDL stays unmapped, because the catalog has only the inverse LDL/HDL ratio", () => {
  expect(findMarker("HDL/LDL")).toBeUndefined();
});

test("a name whose parts point to different markers does not resolve", () => {
  expect(findMarker("Triglycerides - Hemoglobin")).toBeUndefined();
});

test("a name outside the catalog does not resolve", () => {
  expect(findMarker("Blood Group")).toBeUndefined();
});
