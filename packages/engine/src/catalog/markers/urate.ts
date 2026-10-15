import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { acrGout2020, eularGout2016, tietz2022 } = sources;

export const urateMarkers: Marker[] = [
  {
    key: "uric_acid",
    name: "Uric acid",
    shortName: "UA",
    aliases: [
      "serum uric acid",
      "s uric acid",
      "urate",
      "uric acid serum",
      "sua",
      "serum urate",
      "harnsaure",
      "harnsaeure",
    ],
    category: "urate",
    unit: "mg/dL",
    conversions: [
      { from: "µmol/L", factor: 0.0168 },
      { from: "mmol/L", factor: 16.8 },
      { from: "mg/L", factor: 0.1 },
    ],
    precision: 1,
    description: "A waste product that can form crystals in joints when high.",
    whatItIs:
      "The body makes uric acid from purines. Purines are in cells and in foods such as red meat, organ meat and some seafood. The kidneys remove most of it.",
    whyItMatters:
      "Above about 6.8 mg/dL, uric acid can crystallise in joints and cause gout, per EULAR. High levels also occur with insulin resistance, high blood pressure and kidney disease.",
    whatMovesIt:
      "Alcohol, especially beer, sugary drinks, red and organ meat, weight gain and some water pills raise it. Weight loss, fewer sugary drinks and less alcohol lower it.",
    ranges: [
      range(eularGout2016, [null, 6.8], [null, 8.0], { sex: "male" }),
      range(tietz2022, [null, 6.0], [null, 7.0], { sex: "female" }),
    ],
    sources: [eularGout2016, acrGout2020, tietz2022],
    core: false,
    direction: "high_is_bad",
  },
];
