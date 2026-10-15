import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { aga2020, camaschella2015, icmrNin2024, nfhs5, tietz2022, whoFerritin2020 } = sources;

const ironConversions = [{ from: "µmol/L", factor: 5.585 }];

export const ironMarkers: Marker[] = [
  {
    key: "iron",
    name: "Serum iron",
    shortName: "Fe",
    aliases: ["iron", "s iron", "iron serum", "fe", "iron total", "total iron"],
    category: "iron",
    unit: "µg/dL",
    conversions: ironConversions,
    precision: 0,
    description: "Iron circulating in your blood right now.",
    whatItIs:
      "Serum iron is the iron bound to transferrin in the blood at the time of the test. It swings through the day and after meals.",
    whyItMatters:
      "On its own, serum iron is a poor guide to iron stores because it moves so much. It is useful with TIBC to calculate transferrin saturation.",
    whatMovesIt:
      "Recent iron-rich meals or supplements raise it within hours. Iron deficiency, inflammation and evening blood draws lower it.",
    ranges: [
      range(tietz2022, [65, 175], [50, 200], { sex: "male" }),
      range(tietz2022, [50, 170], [40, 200], { sex: "female" }),
    ],
    sources: [tietz2022, camaschella2015, icmrNin2024],
    core: false,
    supplementable: true,
    direction: "both",
  },
  {
    key: "tibc",
    name: "Total iron binding capacity",
    shortName: "TIBC",
    aliases: [
      "total iron binding capacity",
      "tibc serum",
      "iron binding capacity total",
      "iron binding capacity",
    ],
    category: "iron",
    unit: "µg/dL",
    conversions: ironConversions,
    precision: 0,
    description: "How much iron your blood could carry if fully loaded.",
    whatItIs:
      "TIBC measures how much iron the transferrin in your blood could hold. The body makes more transferrin when iron is short.",
    whyItMatters:
      "A high TIBC suggests the body is trying to get more iron, a sign of deficiency. A low TIBC occurs with inflammation or iron overload.",
    whatMovesIt:
      "Iron deficiency, pregnancy and oral contraceptives raise it. Inflammation, liver disease and malnutrition lower it.",
    ranges: [range(tietz2022, [250, 450], [220, 500])],
    sources: [tietz2022, camaschella2015],
    core: false,
    direction: "both",
  },
  {
    key: "uibc",
    name: "Unsaturated iron binding capacity",
    shortName: "UIBC",
    aliases: [
      "unsaturated iron binding capacity",
      "uibc serum",
      "latent iron binding capacity",
      "unbound iron binding capacity",
    ],
    category: "iron",
    unit: "µg/dL",
    conversions: ironConversions,
    precision: 0,
    description: "The spare iron-carrying room left on transferrin.",
    whatItIs:
      "UIBC is the part of transferrin not yet carrying iron. TIBC equals serum iron plus UIBC.",
    whyItMatters:
      "A high UIBC means lots of empty carrying room, which suggests low iron. Doctors read UIBC together with serum iron and ferritin.",
    whatMovesIt:
      "Iron deficiency raises it. Iron supplements, iron overload and inflammation lower it.",
    ranges: [range(tietz2022, [110, 370], [90, 420])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "transferrin",
    name: "Transferrin",
    aliases: ["serum transferrin", "transferrin serum", "tf", "siderophilin"],
    category: "iron",
    unit: "mg/dL",
    conversions: [{ from: "g/L", factor: 100 }],
    precision: 0,
    description: "The protein that carries iron through your blood.",
    whatItIs:
      "Transferrin is the main iron-carrying protein in blood. The liver makes it. Its level rises when the body needs more iron.",
    whyItMatters:
      "High transferrin suggests iron deficiency. Low transferrin can reflect inflammation, liver disease or poor nutrition.",
    whatMovesIt:
      "Iron deficiency, pregnancy and oral contraceptives raise it. Inflammation, liver disease and protein loss lower it.",
    ranges: [range(tietz2022, [200, 360], [180, 400])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "ferritin",
    name: "Ferritin",
    aliases: [
      "serum ferritin",
      "s ferritin",
      "ferritin serum",
      "ferritin level",
      "plasma ferritin",
    ],
    category: "iron",
    unit: "ng/mL",
    conversions: [{ from: "µg/L", factor: 1 }],
    precision: 0,
    description: "Your body's iron stores.",
    whatItIs:
      "Ferritin is the protein that stores iron inside cells, and a small amount circulates in blood. Its blood level tracks total iron stores.",
    whyItMatters:
      "Low ferritin is the earliest sign of iron deficiency, often before hemoglobin falls. The WHO calls under 15 ng/mL deficient in healthy adults. The AGA uses under 45 to diagnose iron deficiency in anaemia.",
    whatMovesIt:
      "Heavy periods, blood donation, pregnancy and a low-iron diet lower it. Inflammation, infection, fatty liver and alcohol raise it, which can hide low iron.",
    ranges: [
      range(aga2020, [45, 300], [15, 500], { sex: "male" }),
      range(aga2020, [45, 200], [15, 300], { sex: "female" }),
    ],
    southAsianNote:
      "NFHS-5 found anaemia in 57% of Indian women aged 15 to 49. Low iron is the most common cause of anaemia worldwide, per WHO. The cut-offs are the same, so MediWise uses the same range here.",
    sources: [aga2020, whoFerritin2020, nfhs5, tietz2022, icmrNin2024],
    core: true,
    supplementable: true,
    direction: "both",
  },
];
