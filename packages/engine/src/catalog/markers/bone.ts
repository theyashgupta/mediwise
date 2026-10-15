import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { endoVitD2011, kost1990, tietz2022 } = sources;

const calciumConversions = [{ from: "mmol/L", factor: 4.008 }];

export const boneMarkers: Marker[] = [
  {
    key: "calcium",
    name: "Calcium",
    shortName: "Ca",
    aliases: [
      "ca",
      "serum calcium",
      "s calcium",
      "total calcium",
      "calcium total",
      "calcium serum",
    ],
    category: "bone",
    unit: "mg/dL",
    conversions: calciumConversions,
    precision: 1,
    description:
      "The mineral for bones, muscles and nerves, which the body holds in a tight range.",
    whatItIs:
      "Calcium is the main mineral in bone and also drives muscle contraction and nerve signals. Total calcium includes the part bound to albumin and the free part.",
    whyItMatters:
      "The body defends blood calcium closely, so an abnormal value usually signals a hormone or vitamin D issue. A low albumin makes total calcium appear low even when the free part is fine.",
    whatMovesIt:
      "Overactive parathyroid glands and too much vitamin D raise it. Vitamin D deficiency, low magnesium and low albumin lower it.",
    ranges: [range(tietz2022, [8.6, 10.2], [8.2, 10.6])],
    sources: [tietz2022, kost1990],
    core: false,
    direction: "both",
  },
  {
    key: "ionized_calcium",
    name: "Ionized calcium",
    aliases: ["ionised calcium", "ica", "free calcium", "calcium ionized", "calcium ionised"],
    category: "bone",
    unit: "mg/dL",
    conversions: calciumConversions,
    precision: 2,
    description: "The free, active part of the calcium in your blood.",
    whatItIs:
      "Ionized calcium is the share of calcium not bound to proteins. It is the part the body actually senses and uses.",
    whyItMatters:
      "It gives a truer picture than total calcium when albumin is abnormal. Out-of-range values suggest parathyroid or vitamin D problems.",
    whatMovesIt:
      "Parathyroid hormone and vitamin D set its level. Blood acidity and sample handling shift it, so it needs careful collection.",
    ranges: [range(tietz2022, [4.6, 5.3], [4.4, 5.6])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "phosphorus",
    name: "Phosphorus",
    shortName: "P",
    aliases: [
      "inorganic phosphorus",
      "serum phosphorus",
      "s phosphorus",
      "phosphate",
      "phosphorus inorganic",
      "po4",
    ],
    category: "bone",
    unit: "mg/dL",
    conversions: [{ from: "mmol/L", factor: 3.097 }],
    precision: 1,
    description: "A mineral that works with calcium to build bone.",
    whatItIs:
      "Phosphorus is a mineral in bone and in the energy molecules of every cell. Labs measure it as phosphate. The kidneys and parathyroid hormone keep it balanced.",
    whyItMatters:
      "A high level is common in advanced kidney disease and stresses blood vessels. A low level can follow poor nutrition, alcohol use or vitamin D deficiency.",
    whatMovesIt:
      "Kidney disease raises it. Malnutrition, alcohol, some antacids and refeeding after starvation lower it.",
    ranges: [range(tietz2022, [2.5, 4.5], [2.2, 5.0])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "pth",
    name: "Parathyroid hormone",
    shortName: "PTH",
    aliases: [
      "parathyroid hormone",
      "intact pth",
      "pth intact",
      "ipth",
      "parathormone",
      "intact parathyroid hormone",
    ],
    category: "bone",
    unit: "pg/mL",
    conversions: [{ from: "pmol/L", factor: 9.43 }],
    precision: 1,
    description: "The hormone that controls calcium levels in your blood.",
    whatItIs:
      "Four small glands in the neck make PTH. It uses bone, the kidneys and vitamin D to raise blood calcium.",
    whyItMatters:
      "A high PTH with low vitamin D shows the deficiency is already affecting bone. A high PTH with high calcium suggests an overactive gland.",
    whatMovesIt:
      "Vitamin D deficiency, low calcium intake and kidney disease raise it. Correcting vitamin D usually lowers it over a few months.",
    ranges: [range(tietz2022, [15, 65], [10, 80])],
    sources: [tietz2022, endoVitD2011],
    core: false,
    direction: "both",
  },
];
