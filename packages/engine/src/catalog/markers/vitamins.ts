import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const {
  bsh2014,
  endoVitD2011,
  endoVitD2024,
  iomAntioxidants2000,
  iomBVitamins1998,
  iomVitD2011,
  tietz2022,
  whoFolate2015,
  whoRetinol2011,
  yajnik2006,
} = sources;

export const vitaminMarkers: Marker[] = [
  {
    key: "vitamin_d",
    name: "Vitamin D (25-OH)",
    shortName: "Vit D",
    aliases: [
      "vitamin d",
      "vit d",
      "25 oh vitamin d",
      "25 hydroxy vitamin d",
      "25 hydroxyvitamin d",
      "vitamin d total",
      "25 oh vitamin d total",
      "vitamin d 25 hydroxy",
      "25 oh vit d",
      "vitamin d3",
      "cholecalciferol",
    ],
    category: "vitamins",
    unit: "ng/mL",
    conversions: [{ from: "nmol/L", factor: 0.4006 }],
    precision: 1,
    description: "Your vitamin D stores, key for bones, muscles and immunity.",
    whatItIs:
      "This test measures 25-hydroxy vitamin D, the storage form made in the liver from sunlight and food. It reflects supply over the past few weeks.",
    whyItMatters:
      "The Endocrine Society's 2011 guideline calls under 20 ng/mL deficient and 30 or above sufficient. Its 2024 update stopped advising routine testing in healthy adults, but very low levels still harm bone and muscle.",
    whatMovesIt:
      "Midday sun on bare skin, supplements and fortified foods raise it. Little time outdoors, darker skin, covering clothing, obesity and some medicines lower it.",
    ranges: [range(endoVitD2011, [30, 100], [20, 150])],
    southAsianNote:
      "Darker skin makes less vitamin D from the same sunlight. The Endocrine Society lists darker skin as a risk factor for deficiency. No source publishes a South Asian specific range, so MediWise uses the same range here.",
    sources: [endoVitD2011, endoVitD2024, iomVitD2011],
    core: true,
    supplementable: true,
    direction: "both",
  },
  {
    key: "vitamin_b12",
    name: "Vitamin B12",
    shortName: "B12",
    aliases: [
      "b12",
      "vit b12",
      "vitamin b 12",
      "cyanocobalamin",
      "cobalamin",
      "serum b12",
      "serum vitamin b12",
      "vitamin b12 serum",
    ],
    category: "vitamins",
    unit: "pg/mL",
    conversions: [{ from: "pmol/L", factor: 1.355 }],
    precision: 0,
    description: "A vitamin for nerves and red blood cells, found in animal foods.",
    whatItIs:
      "The body needs vitamin B12 to make red blood cells and to keep nerves healthy. It comes almost only from animal foods such as milk, curd, eggs, fish and meat.",
    whyItMatters:
      "Low B12 causes tiredness, tingling, memory problems and large-cell anaemia, and nerve damage can become permanent. The BSH treats under 200 pg/mL as likely deficient and 200 to 300 as a grey zone.",
    whatMovesIt:
      "Vegetarian and vegan diets, metformin, long-term acid-reducing pills and age lower it. Supplements, injections and more dairy, eggs or fish raise it.",
    ranges: [range(bsh2014, [300, null], [200, null])],
    southAsianNote:
      "B12 deficiency is very common in India, especially in vegetarians. Yajnik and colleagues linked it to high homocysteine in rural and urban Indian adults. No source publishes a separate range, so MediWise uses the same range here.",
    sources: [bsh2014, yajnik2006],
    core: true,
    supplementable: true,
    direction: "low_is_bad",
  },
  {
    key: "folate",
    name: "Folate",
    shortName: "B9",
    aliases: [
      "folic acid",
      "serum folate",
      "folate serum",
      "vitamin b9",
      "vit b9",
      "serum folic acid",
    ],
    category: "vitamins",
    unit: "ng/mL",
    conversions: [{ from: "nmol/L", factor: 0.4413 }],
    precision: 1,
    description: "A B vitamin for making new cells, from greens and pulses.",
    whatItIs:
      "The body needs folate, vitamin B9, to make DNA and new cells, including red blood cells. It comes from leafy greens, pulses and fortified foods.",
    whyItMatters:
      "Low folate causes large-cell anaemia and raises homocysteine. The WHO uses 4 ng/mL as the cut-off for deficiency based on homocysteine.",
    whatMovesIt:
      "Low intake of greens and pulses, alcohol and some medicines lower it. A recent folate-rich meal or supplement raises serum folate quickly.",
    ranges: [range(whoFolate2015, [4.0, null], [3.0, null])],
    sources: [whoFolate2015, bsh2014],
    core: false,
    supplementable: true,
    direction: "low_is_bad",
  },
  {
    key: "vitamin_a",
    name: "Vitamin A",
    aliases: ["retinol", "serum retinol", "vit a", "vitamin a retinol", "serum vitamin a"],
    category: "vitamins",
    unit: "µg/dL",
    conversions: [{ from: "µmol/L", factor: 28.65 }],
    precision: 1,
    description: "A vitamin for vision, skin and immune defence.",
    whatItIs:
      "This test measures retinol, the main form of vitamin A in blood. Vitamin A comes from dairy, eggs and liver, and from carotenes in orange and green vegetables.",
    whyItMatters:
      "The WHO uses under 20 µg/dL to define deficiency, which affects night vision and immunity. Very high levels, usually from supplements, can harm the liver and bones.",
    whatMovesIt:
      "Diet and supplements set it. Infection and inflammation lower blood retinol for a while even when stores are fine.",
    ranges: [range(whoRetinol2011, [30, 80], [20, 100])],
    sources: [whoRetinol2011, tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "vitamin_e",
    name: "Vitamin E",
    aliases: ["tocopherol", "alpha tocopherol", "vit e", "serum vitamin e", "vitamin e tocopherol"],
    category: "vitamins",
    unit: "mg/L",
    conversions: [
      { from: "µmol/L", factor: 0.4307 },
      { from: "µg/mL", factor: 1 },
    ],
    precision: 1,
    description: "An antioxidant vitamin that protects cell membranes.",
    whatItIs:
      "This test measures alpha-tocopherol, the main form of vitamin E. It comes from nuts, seeds and vegetable oils.",
    whyItMatters:
      "True deficiency is rare and usually comes from poor fat absorption, and it can affect nerves and muscles. The Institute of Medicine uses 12 µmol/L, about 5.2 mg/L, as the adequacy cut-off.",
    whatMovesIt:
      "Fat absorption problems and very low-fat diets lower it. Blood lipid levels raise it, so doctors often interpret it alongside cholesterol.",
    ranges: [range(iomAntioxidants2000, [5.2, null], [4.3, null])],
    sources: [iomAntioxidants2000],
    core: false,
    direction: "low_is_bad",
  },
  {
    key: "vitamin_b6",
    name: "Vitamin B6",
    aliases: [
      "pyridoxal phosphate",
      "pyridoxal 5 phosphate",
      "plp",
      "vit b6",
      "pyridoxine",
      "vitamin b 6",
    ],
    category: "vitamins",
    unit: "nmol/L",
    conversions: [
      { from: "µg/L", factor: 4.046 },
      { from: "ng/mL", factor: 4.046 },
    ],
    precision: 1,
    description: "A B vitamin for protein metabolism, nerves and mood.",
    whatItIs:
      "This test measures pyridoxal phosphate, the active form of vitamin B6. B6 helps process protein and clear homocysteine.",
    whyItMatters:
      "The Institute of Medicine uses 20 nmol/L as the adequacy cut-off. High levels from long-term supplements can damage nerves, so too much matters as well as too little.",
    whatMovesIt:
      "Alcohol, some medicines and kidney disease lower it. Supplements and energy drinks with added B6 raise it.",
    ranges: [range(tietz2022, [20, 125], [15, 200])],
    sources: [tietz2022, iomBVitamins1998],
    core: false,
    direction: "both",
  },
];
