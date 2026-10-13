import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { ahaAcc2018, ahaCdc2003, dacie2017, tietz2022 } = sources;

const crpConversions = [{ from: "mg/dL", factor: 10 }];

export const inflammationMarkers: Marker[] = [
  {
    key: "crp",
    name: "C-reactive protein",
    shortName: "CRP",
    aliases: [
      "c reactive protein",
      "crp quantitative",
      "c reactive protein quantitative",
      "serum crp",
      "crp serum",
    ],
    category: "inflammation",
    unit: "mg/L",
    conversions: crpConversions,
    precision: 1,
    description: "A protein that rises quickly with infection or inflammation.",
    whatItIs:
      "The liver makes CRP within hours of an infection, injury or flare of inflammation. The standard CRP test targets these larger rises.",
    whyItMatters:
      "A raised CRP confirms that something inflammatory is happening. It does not show where. Very high values usually mean an active infection.",
    whatMovesIt:
      "Infections, injuries, surgery and inflammatory conditions raise it within a day. It falls within days once the cause settles.",
    ranges: [range(tietz2022, [null, 5], [null, 10])],
    sources: [tietz2022],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "hs_crp",
    name: "High-sensitivity CRP",
    shortName: "hs-CRP",
    aliases: [
      "hscrp",
      "hs crp",
      "high sensitivity crp",
      "high sensitivity c reactive protein",
      "highly sensitive c reactive protein",
      "hs c reactive protein",
      "c reactive protein high sensitive",
      "cardiac crp",
    ],
    category: "inflammation",
    unit: "mg/L",
    conversions: crpConversions,
    precision: 2,
    description: "Low-grade inflammation linked with heart and metabolic risk.",
    whatItIs:
      "hs-CRP measures the same protein as CRP but detects much lower levels. That makes it useful for spotting quiet, long-term inflammation.",
    whyItMatters:
      "The AHA and CDC class under 1 mg/L as low heart risk. They class 1 to 3 as average and above 3 as high. A value above 10 usually reflects a passing infection, so you should repeat the test when you are well.",
    whatMovesIt:
      "Belly fat, smoking, poor sleep, gum disease and recent illness raise it. Weight loss, exercise, quitting smoking and statins lower it.",
    ranges: [range(ahaCdc2003, [null, 1.0], [null, 3.0])],
    sources: [ahaCdc2003, ahaAcc2018],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "esr",
    name: "Erythrocyte sedimentation rate",
    shortName: "ESR",
    aliases: [
      "erythrocyte sedimentation rate",
      "sed rate",
      "esr westergren",
      "westergren esr",
      "esr 1st hour",
      "esr 1 hour",
    ],
    category: "inflammation",
    unit: "mm/hr",
    conversions: [],
    precision: 0,
    description: "How fast red cells settle, a broad sign of inflammation.",
    whatItIs:
      "ESR measures how far red cells fall in a tube of blood in one hour. Inflammation adds proteins that make cells clump and fall faster.",
    whyItMatters:
      "A raised ESR is a general signal of inflammation, infection or anaemia rather than a specific diagnosis. It rises naturally with age and is higher in women.",
    whatMovesIt:
      "Infection, inflammatory conditions, anaemia, pregnancy and age raise it. It changes slowly, over weeks.",
    ranges: [
      range(dacie2017, [null, 15], [null, 30], { sex: "male", ageMax: 50 }),
      range(dacie2017, [null, 20], [null, 35], { sex: "male", ageMin: 50 }),
      range(dacie2017, [null, 20], [null, 35], { sex: "female", ageMax: 50 }),
      range(dacie2017, [null, 30], [null, 45], { sex: "female", ageMin: 50 }),
    ],
    sources: [dacie2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "rheumatoid_factor",
    name: "Rheumatoid factor",
    shortName: "RF",
    aliases: [
      "ra factor",
      "rf",
      "ra test",
      "rheumatoid factor quantitative",
      "ra factor quantitative",
    ],
    category: "inflammation",
    unit: "IU/mL",
    conversions: [{ from: "U/mL", factor: 1 }],
    precision: 1,
    description: "An antibody often raised in rheumatoid arthritis.",
    whatItIs:
      "Rheumatoid factor is an antibody that targets the body's own antibodies. It is one of the markers doctors test when joint pain suggests rheumatoid arthritis.",
    whyItMatters:
      "A positive RF supports rheumatoid arthritis when symptoms fit. Healthy older adults and people with other conditions can also test positive. A doctor needs to interpret the value.",
    whatMovesIt:
      "Rheumatoid arthritis, other autoimmune conditions, chronic infections and age raise it. A low positive RF can stay the same for years without disease.",
    ranges: [range(tietz2022, [null, 14], [null, 20])],
    sources: [tietz2022],
    core: false,
    direction: "high_is_bad",
  },
];
