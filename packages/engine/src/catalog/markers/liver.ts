import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { acg2017, tietz2022 } = sources;

const bilirubinConversions = [{ from: "µmol/L", factor: 0.05847 }];
const proteinConversions = [{ from: "g/L", factor: 0.1 }];

export const liverMarkers: Marker[] = [
  {
    key: "bilirubin_total",
    name: "Total bilirubin",
    aliases: [
      "bilirubin total",
      "total bilirubin",
      "serum bilirubin total",
      "s bilirubin total",
      "bilirubin",
      "t bilirubin",
      "tbil",
    ],
    category: "liver",
    unit: "mg/dL",
    conversions: bilirubinConversions,
    precision: 2,
    description: "A yellow pigment from old red cells that the liver clears.",
    whatItIs:
      "The body makes bilirubin from old red blood cells. The liver processes it and removes it in bile.",
    whyItMatters:
      "A high level can mean the liver or bile ducts are struggling, or that red cell breakdown is fast. A mild rise with normal liver enzymes is often Gilbert syndrome, a harmless inherited trait.",
    whatMovesIt:
      "Fasting, illness and Gilbert syndrome raise it mildly. Liver inflammation, gallstones and red cell breakdown raise it more.",
    ranges: [range(tietz2022, [null, 1.2], [null, 2.0])],
    sources: [tietz2022, acg2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "bilirubin_direct",
    name: "Direct bilirubin",
    aliases: [
      "bilirubin direct",
      "direct bilirubin",
      "conjugated bilirubin",
      "bilirubin conjugated",
      "d bilirubin",
      "dbil",
    ],
    category: "liver",
    unit: "mg/dL",
    conversions: bilirubinConversions,
    precision: 2,
    description: "Bilirubin that the liver already processed.",
    whatItIs:
      "Direct, or conjugated, bilirubin is the form that the liver already processed for removal in bile. It is a small part of the total in health.",
    whyItMatters:
      "A raised direct bilirubin suggests a problem with the liver itself or with bile flow, rather than with red cells. It is a reason to check the other liver markers together.",
    whatMovesIt:
      "Hepatitis, fatty liver inflammation, gallstones blocking a duct and some medicines raise it. It falls as the cause settles.",
    ranges: [range(tietz2022, [null, 0.3], [null, 0.5])],
    sources: [tietz2022, acg2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "bilirubin_indirect",
    name: "Indirect bilirubin",
    aliases: [
      "bilirubin indirect",
      "indirect bilirubin",
      "unconjugated bilirubin",
      "bilirubin unconjugated",
      "i bilirubin",
    ],
    category: "liver",
    unit: "mg/dL",
    conversions: bilirubinConversions,
    precision: 2,
    description: "Bilirubin on its way to the liver, not yet processed.",
    whatItIs:
      "Indirect, or unconjugated, bilirubin is the form still travelling to the liver. Labs calculate it as total minus direct bilirubin.",
    whyItMatters:
      "A rise on its own usually means Gilbert syndrome or faster red cell breakdown. It rarely signals liver damage by itself.",
    whatMovesIt:
      "Fasting, stress and illness raise it in people with Gilbert syndrome. Red cell breakdown from any cause raises it too.",
    ranges: [range(tietz2022, [null, 1.0], [null, 1.8])],
    sources: [tietz2022],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "ast",
    name: "AST (SGOT)",
    shortName: "AST",
    aliases: [
      "sgot",
      "aspartate aminotransferase",
      "aspartate transaminase",
      "ast sgot",
      "sgot ast",
      "sgot aspartate transaminase",
      "serum glutamic oxaloacetic transaminase",
    ],
    category: "liver",
    unit: "U/L",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 0,
    description: "An enzyme that liver or muscle cells release under stress.",
    whatItIs:
      "AST is an enzyme found in the liver, heart and muscles. It leaks into blood when injury damages those cells.",
    whyItMatters:
      "A raised AST can reflect liver strain, but hard exercise and muscle injury raise it too. Doctors read it together with ALT.",
    whatMovesIt:
      "Alcohol, fatty liver, some medicines and intense workouts raise it. Weight loss and cutting alcohol lower liver-driven rises.",
    ranges: [range(tietz2022, [null, 35], [null, 70])],
    sources: [tietz2022, acg2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "alt",
    name: "ALT (SGPT)",
    shortName: "ALT",
    aliases: [
      "sgpt",
      "alanine aminotransferase",
      "alanine transaminase",
      "alt sgpt",
      "sgpt alt",
      "sgpt alanine transaminase",
      "serum glutamic pyruvic transaminase",
    ],
    category: "liver",
    unit: "U/L",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 0,
    description: "The enzyme that best reflects strain on liver cells.",
    whatItIs:
      "ALT is an enzyme made mostly in liver cells. When those cells are inflamed or damaged, ALT leaks into blood.",
    whyItMatters:
      "ALT is the most liver-specific routine enzyme, and a raised value is often the first sign of fatty liver. The ACG sets the healthy upper limit at 33 U/L for men and 25 for women. This is lower than many lab ranges.",
    whatMovesIt:
      "Fatty liver, alcohol, viral hepatitis and some medicines and supplements raise it. Weight loss, less sugar and alcohol, and exercise lower it.",
    ranges: [
      range(acg2017, [null, 33], [null, 66], { sex: "male" }),
      range(acg2017, [null, 25], [null, 50], { sex: "female" }),
    ],
    sources: [acg2017],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "alp",
    name: "Alkaline phosphatase",
    shortName: "ALP",
    aliases: [
      "alkaline phosphatase",
      "alk phos",
      "alkp",
      "serum alkaline phosphatase",
      "s alkaline phosphatase",
    ],
    category: "liver",
    unit: "U/L",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 0,
    description: "An enzyme from the bile ducts and bones.",
    whatItIs:
      "ALP is an enzyme found mainly in the bile ducts of the liver and in bone. Children and teenagers have much higher levels because their bones are growing.",
    whyItMatters:
      "A high ALP in an adult suggests slowed bile flow or high bone turnover. GGT helps distinguish the two.",
    whatMovesIt:
      "Bile duct blockage, bone healing, vitamin D deficiency and pregnancy raise it. Zinc deficiency and some rare conditions lower it.",
    ranges: [range(tietz2022, [40, 130], [30, 160])],
    sources: [tietz2022, acg2017],
    core: false,
    direction: "both",
  },
  {
    key: "ggt",
    name: "Gamma-glutamyl transferase",
    shortName: "GGT",
    aliases: [
      "gamma gt",
      "gamma glutamyl transferase",
      "gamma glutamyl transpeptidase",
      "ggtp",
      "g gt",
      "serum ggt",
      "ggtp serum",
    ],
    category: "liver",
    unit: "U/L",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 0,
    description: "A liver enzyme sensitive to alcohol and bile flow.",
    whatItIs:
      "GGT is an enzyme found in the liver and bile ducts. It rises with alcohol, fatty liver and slowed bile flow.",
    whyItMatters:
      "A raised GGT is linked with higher cardiometabolic risk even within the lab range. It also tells whether a high ALP comes from the liver or from bone.",
    whatMovesIt:
      "Alcohol, fatty liver, smoking and some medicines raise it. Cutting alcohol lowers it within weeks.",
    ranges: [
      range(tietz2022, [null, 61], [null, 120], { sex: "male" }),
      range(tietz2022, [null, 36], [null, 72], { sex: "female" }),
    ],
    sources: [tietz2022, acg2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "total_protein",
    name: "Total protein",
    aliases: [
      "protein total",
      "total protein",
      "serum total protein",
      "s total protein",
      "total proteins",
      "serum protein",
    ],
    category: "liver",
    unit: "g/dL",
    conversions: proteinConversions,
    precision: 1,
    description: "All the protein in your blood, mainly albumin and globulins.",
    whatItIs:
      "Total protein is the sum of albumin and globulins in blood. The liver makes albumin, and globulins include antibodies.",
    whyItMatters:
      "A low value can reflect poor nutrition, liver disease or protein loss through the kidneys. A high value can reflect dehydration or raised antibodies.",
    whatMovesIt:
      "Hydration shifts it quickly. Nutrition, liver function, kidney protein loss and chronic inflammation move it over weeks.",
    ranges: [range(tietz2022, [6.4, 8.3], [6.0, 8.8])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "albumin",
    name: "Albumin",
    aliases: ["serum albumin", "s albumin", "albumin serum", "alb", "albumin blood"],
    category: "liver",
    unit: "g/dL",
    conversions: proteinConversions,
    precision: 1,
    description: "The main protein the liver makes, a marker of nutrition.",
    whatItIs:
      "Albumin is the most plentiful protein in blood, and the liver makes it. It keeps fluid inside blood vessels and carries hormones and medicines.",
    whyItMatters:
      "A low albumin can signal poor nutrition, long-standing liver disease, protein loss in urine or ongoing inflammation. It is also linked with poorer health outcomes in older adults.",
    whatMovesIt:
      "Adequate protein intake and recovery from illness raise it. Inflammation, liver disease and kidney protein loss lower it, and dehydration raises it falsely.",
    ranges: [range(tietz2022, [3.5, null], [3.0, null])],
    sources: [tietz2022],
    core: false,
    direction: "low_is_bad",
  },
];
