import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { tietz2022 } = sources;

const mEq = [{ from: "mEq/L", factor: 1 }];

export const electrolyteMarkers: Marker[] = [
  {
    key: "sodium",
    name: "Sodium",
    shortName: "Na",
    aliases: ["na", "serum sodium", "s sodium", "sodium serum", "na plus"],
    category: "electrolytes",
    unit: "mmol/L",
    conversions: mEq,
    precision: 0,
    description: "The main salt in your blood, which controls water balance.",
    whatItIs:
      "Sodium is the most plentiful salt in the fluid outside cells. The body holds it in a tight range to keep water balance and nerve signals steady.",
    whyItMatters:
      "Low sodium can cause confusion, weakness and falls, especially in older adults. High sodium usually means dehydration.",
    whatMovesIt:
      "Drinking large amounts of water, some blood pressure pills and some antidepressants lower it. Dehydration and fluid loss raise it.",
    ranges: [range(tietz2022, [136, 145], [133, 148])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "potassium",
    name: "Potassium",
    shortName: "K",
    aliases: ["k", "serum potassium", "s potassium", "potassium serum", "k plus"],
    category: "electrolytes",
    unit: "mmol/L",
    conversions: mEq,
    precision: 1,
    description: "A salt that keeps your heart rhythm and muscles working.",
    whatItIs:
      "Potassium is the main salt inside cells. Small changes in its blood level affect how the heart and muscles fire.",
    whyItMatters:
      "Both low and high potassium can disturb heart rhythm. A high value is often false. Red cells that break in the tube cause this false rise, so labs repeat a surprising value.",
    whatMovesIt:
      "Water pills, vomiting and diarrhoea lower it. Kidney disease, some blood pressure medicines and potassium supplements raise it.",
    ranges: [range(tietz2022, [3.5, 5.0], [3.2, 5.5])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "chloride",
    name: "Chloride",
    shortName: "Cl",
    aliases: ["cl", "serum chloride", "s chloride", "chloride serum", "cl minus"],
    category: "electrolytes",
    unit: "mmol/L",
    conversions: mEq,
    precision: 0,
    description: "A salt that moves with sodium to balance body fluids.",
    whatItIs:
      "Chloride is a salt that travels with sodium in body fluids. It helps keep fluid balance and the acid level of blood.",
    whyItMatters:
      "Chloride usually moves with sodium, so it mostly confirms what sodium shows. A mismatch can suggest an acid-base imbalance.",
    whatMovesIt:
      "Dehydration and some kidney conditions raise it. Vomiting and water pills lower it.",
    ranges: [range(tietz2022, [98, 107], [95, 110])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "bicarbonate",
    name: "Bicarbonate",
    shortName: "HCO3",
    aliases: ["hco3", "total co2", "tco2", "co2", "serum bicarbonate", "bicarbonate serum"],
    category: "electrolytes",
    unit: "mmol/L",
    conversions: mEq,
    precision: 0,
    description: "The main buffer that keeps your blood from turning acidic.",
    whatItIs:
      "Bicarbonate is the body's main buffer against acid. Labs often report it as total carbon dioxide.",
    whyItMatters:
      "A low level can mean acid is accumulating, as in kidney disease or uncontrolled diabetes. A high level can follow vomiting or water pills.",
    whatMovesIt:
      "Kidney disease, severe diarrhoea and very uncontrolled diabetes lower it. Vomiting and some water pills raise it.",
    ranges: [range(tietz2022, [22, 29], [20, 31])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "magnesium",
    name: "Magnesium",
    shortName: "Mg",
    aliases: ["mg", "serum magnesium", "s magnesium", "magnesium serum", "mg plus plus"],
    category: "electrolytes",
    unit: "mg/dL",
    conversions: [
      { from: "mmol/L", factor: 2.431 },
      { from: "mEq/L", factor: 1.215 },
    ],
    precision: 1,
    description: "A mineral needed for muscles, nerves and steady heart rhythm.",
    whatItIs:
      "Magnesium is a mineral involved in hundreds of enzyme reactions, including energy use and muscle relaxation. Most of it sits in bone and cells, so blood shows only a slice.",
    whyItMatters:
      "Low magnesium can cause cramps, palpitations and low potassium or calcium that will not correct. It is linked with insulin resistance.",
    whatMovesIt:
      "Alcohol, acid-reducing pills taken for years, water pills, diarrhoea and uncontrolled diabetes lower it. Nuts, seeds, pulses and leafy greens raise intake.",
    ranges: [range(tietz2022, [1.7, 2.4], [1.5, 2.6])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
];
