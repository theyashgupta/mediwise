import type { Category } from "./schema.js";

export const categories: { key: Category; label: string }[] = [
  { key: "metabolic", label: "Blood sugar" },
  { key: "lipids", label: "Cholesterol and lipids" },
  { key: "cardiac", label: "Heart" },
  { key: "inflammation", label: "Inflammation" },
  { key: "liver", label: "Liver" },
  { key: "kidney", label: "Kidney" },
  { key: "thyroid", label: "Thyroid" },
  { key: "vitamins", label: "Vitamins" },
  { key: "iron", label: "Iron" },
  { key: "blood_count", label: "Blood count" },
  { key: "electrolytes", label: "Electrolytes" },
  { key: "bone", label: "Bone and minerals" },
  { key: "urate", label: "Uric acid" },
  { key: "hormones", label: "Hormones" },
  { key: "urine", label: "Urine" },
  { key: "vitals", label: "Vitals" },
  { key: "studies", label: "Scans and ECG" },
  { key: "other", label: "Other" },
];
