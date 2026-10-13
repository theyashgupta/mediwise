import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { escHf2021, refsum2004, yajnik2006 } = sources;

export const cardiacMarkers: Marker[] = [
  {
    key: "homocysteine",
    name: "Homocysteine",
    shortName: "Hcy",
    aliases: [
      "hcy",
      "serum homocysteine",
      "plasma homocysteine",
      "total homocysteine",
      "thcy",
      "homocysteine serum",
      "homocysteine quantitative",
    ],
    category: "cardiac",
    unit: "µmol/L",
    conversions: [],
    precision: 1,
    description: "An amino acid that rises when B12 or folate is low.",
    whatItIs:
      "Homocysteine is an amino acid that the body makes during normal protein metabolism. The body needs vitamin B12, folate and vitamin B6 to clear it.",
    whyItMatters:
      "A high level is linked with higher risk of stroke and heart disease, and often signals low B12 or folate. Refsum and colleagues set the upper reference limit at 15 µmol/L for adults, or 12 where diets are folate-rich.",
    whatMovesIt:
      "Low B12 or folate, kidney disease, smoking, heavy coffee and some medicines raise it. Correcting B12 and folate usually lowers it within weeks.",
    ranges: [range(refsum2004, [null, 12], [null, 15])],
    southAsianNote:
      "High homocysteine is common in Indians, and vitamin B12 deficiency mainly drives it, especially in vegetarians. Yajnik and colleagues showed this in rural and urban Indian adults. There is no separate published range, so the same range applies here.",
    sources: [refsum2004, yajnik2006],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "nt_probnp",
    name: "NT-proBNP",
    shortName: "NT-proBNP",
    aliases: [
      "nt probnp",
      "nt pro bnp",
      "ntprobnp",
      "n terminal pro b type natriuretic peptide",
      "pro bnp",
      "probnp",
    ],
    category: "cardiac",
    unit: "pg/mL",
    conversions: [{ from: "pmol/L", factor: 8.457 }],
    precision: 0,
    description: "A hormone the heart releases when its muscle is under strain.",
    whatItIs:
      "The heart releases NT-proBNP when pressure or fluid stretches its walls. It is a standard blood marker for heart strain.",
    whyItMatters:
      "The ESC uses a value under 125 pg/mL to make chronic heart failure unlikely. Higher values need a doctor's review and often a heart scan.",
    whatMovesIt:
      "Heart strain, high blood pressure, kidney disease, age and atrial fibrillation raise it. Obesity lowers it, which can hide strain.",
    ranges: [range(escHf2021, [null, 124], [null, 300])],
    sources: [escHf2021],
    core: false,
    direction: "high_is_bad",
  },
];
