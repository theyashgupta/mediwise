import type { Source } from "../catalog/index.js";
import { sources } from "../catalog/sources.js";

const {
  andreotti2020,
  bankier2024,
  eauUrolithiasis2024,
  joglar2023,
  kusumoto2019,
  nayar2015,
  rautaharju2009,
  roberts2023,
} = sources;

type AlertRule = { key: string; says: RegExp; minSizeMm?: number; sources: Source[] };

export const studyAlertRules: AlertRule[] = [
  { key: "mass", says: /(?<!body )\bmass(es)?\b/i, sources: [bankier2024, andreotti2020] },
  { key: "lesion", says: /\blesions?\b/i, sources: [bankier2024, nayar2015] },
  { key: "nodule", says: /\bnodul(e|es|ar)\b/i, sources: [bankier2024] },
  { key: "cyst", says: /\bcyst/i, minSizeMm: 30, sources: [andreotti2020] },
  { key: "calculus", says: /\bcalcul(us|i)\b|\b(gall)?stones?\b/i, sources: [eauUrolithiasis2024] },
  { key: "hydronephrosis", says: /\bhydronephros/i, sources: [eauUrolithiasis2024] },
  { key: "effusion", says: /\beffusion/i, sources: [roberts2023] },
  { key: "consolidation", says: /\bconsolidat/i, sources: [bankier2024] },
  { key: "cardiomegaly", says: /\bcardiomegaly\b/i, sources: [bankier2024] },
  {
    key: "st_change",
    says: /\bST[- ](segment[- ])?(elevation|depression)\b/i,
    sources: [rautaharju2009],
  },
  { key: "atrial_arrhythmia", says: /\b(fibrillation|flutter)\b/i, sources: [joglar2023] },
  {
    key: "heart_block",
    says: /\b(second|third|2nd|3rd)[- ]degree\b|\bcomplete heart block\b|\bmobitz\b/i,
    sources: [kusumoto2019],
  },
  { key: "atypical", says: /\batypi(a|cal)\b/i, sources: [nayar2015] },
  {
    key: "malignancy",
    says: /\bmalignan(cy|t)\b|\bcarcinoma\b|\bneoplas/i,
    sources: [nayar2015],
  },
  { key: "suspicious", says: /\bsuspicious\b/i, sources: [nayar2015] },
  {
    key: "not_separate",
    says: /\bcould not be (seen|separated|visuali[sz]ed) separate/i,
    sources: [andreotti2020],
  },
];

const negation = /\b(no|not|without|negative for|absence of|free of|nil)\b/i;
const clauseBreak = /\b(?:but|however|although|though)\b|[;:]/i;
const size = /(\d+(?:\.\d+)?(?:\s*[x×*]\s*\d+(?:\.\d+)?)*)\s*(mm|cm)\b/gi;

/** The largest printed size in a sentence, in millimetres, or 0 when it prints none. */
function largestMm(sentence: string) {
  let largest = 0;
  for (const [, numbers = "", unit = ""] of sentence.matchAll(size)) {
    const factor = unit.toLowerCase() === "cm" ? 10 : 1;
    for (const number of numbers.split(/[x×*]/)) {
      largest = Math.max(largest, Number(number) * factor);
    }
  }
  return largest;
}

/**
 * Tells whether a rule matches a sentence as a positive statement.
 *
 * @remarks
 * A negation word earlier in the same clause cancels the match, so "No focal mass lesion" and "Negative for
 * Intraepithelial Lesion" never count. A phrase that holds its own negation, such as "could not be seen separate", still counts.
 */
function saysPositive(rule: AlertRule, sentence: string) {
  for (const match of sentence.matchAll(new RegExp(rule.says.source, "gi"))) {
    const clause = sentence.slice(0, match.index).split(clauseBreak).at(-1) ?? "";
    if (negation.test(clause)) continue;
    if (rule.minSizeMm && largestMm(sentence) < rule.minSizeMm) continue;
    return true;
  }
  return false;
}

/**
 * Finds the first printed sentence that marks a study as one to ask the doctor about, or undefined.
 *
 * @remarks
 * Each line and each sentence of a line is checked alone against the sourced rule table.
 * ponytail: a negation in the same clause hides a later positive phrase ("No hydronephrosis, 6 mm calculus"). Add a
 * scoped negation window if real reports print that shape.
 */
export function alertLine(texts: (string | null | undefined)[]) {
  const sentences = texts
    .flatMap((text) => (text ?? "").split(/\n|(?<=\.)\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.find((sentence) => studyAlertRules.some((rule) => saysPositive(rule, sentence)));
}
