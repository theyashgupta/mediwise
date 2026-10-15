import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { ahaAcc2018, easLpa2022, escEas2019, icmrIndiab2023, lai2023, ncepAtp3, tietz2022 } =
  sources;

const cholesterolConversions = [
  { from: "mmol/L", factor: 38.67 },
  { from: "g/L", factor: 100 },
];
const apoConversions = [{ from: "g/L", factor: 100 }];

export const lipidMarkers: Marker[] = [
  {
    key: "total_cholesterol",
    name: "Total cholesterol",
    shortName: "TC",
    aliases: [
      "cholesterol",
      "cholesterol total",
      "serum cholesterol",
      "total cholesterol serum",
      "s cholesterol",
      "cholesterol serum",
      "cholesterin",
      "cholesterin gesamt",
      "gesamtcholesterin",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: cholesterolConversions,
    precision: 0,
    description: "All the cholesterol carried in your blood.",
    whatItIs:
      "Total cholesterol combines the cholesterol in all lipoprotein particles, the good HDL and the harmful LDL and VLDL. It is a rough summary, not a target on its own.",
    whyItMatters:
      "Under 200 mg/dL is desirable and 240 or above is high, by ATP III. Because it mixes good and bad cholesterol, LDL, non-HDL and ApoB tell more.",
    whatMovesIt:
      "Saturated and trans fats, weight gain and genetics raise it. Fibre, exercise, weight loss and statins lower it.",
    ranges: [range(ncepAtp3, [null, 199], [null, 239])],
    sources: [ncepAtp3, ahaAcc2018],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "ldl_cholesterol",
    name: "LDL cholesterol",
    shortName: "LDL-C",
    aliases: [
      "ldl",
      "ldl c",
      "ldl cholesterol direct",
      "direct ldl",
      "low density lipoprotein",
      "low density lipoprotein cholesterol",
      "cholesterol ldl",
      "ldl direct",
      "ldl calculated",
      "ldl cholesterin",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: cholesterolConversions,
    precision: 0,
    description: "The main cholesterol that collects in artery walls.",
    whatItIs:
      "LDL cholesterol is the cholesterol that low-density lipoprotein particles carry. These particles can lodge in artery walls and build plaque.",
    whyItMatters:
      "LDL is the best-proven cause of heart attack and stroke, and lower is better for arteries. ATP III calls under 100 mg/dL optimal and 160 or above high.",
    whatMovesIt:
      "Genetics, saturated and trans fats and weight gain raise it. Soluble fibre, fewer saturated fats, exercise and medicines such as statins lower it.",
    ranges: [
      range(ncepAtp3, [null, 99], [null, 159]),
      range(lai2023, [null, 99], [null, 129], { ancestry: "south_asian" }),
    ],
    southAsianNote:
      "Indians get heart disease about a decade earlier than Western populations. For this reason, the Lipid Association of India (LAI) sets stricter LDL goals. For a person with no other risk factors, LAI aims for under 100 mg/dL and considers treatment from 130.",
    sources: [ncepAtp3, lai2023, ahaAcc2018],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "hdl_cholesterol",
    name: "HDL cholesterol",
    shortName: "HDL-C",
    aliases: [
      "hdl",
      "hdl c",
      "hdl cholesterol direct",
      "direct hdl",
      "high density lipoprotein",
      "high density lipoprotein cholesterol",
      "cholesterol hdl",
      "hdl direct",
      "hdl cholesterin",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: cholesterolConversions,
    precision: 0,
    description: "The cholesterol that removes fat from your arteries.",
    whatItIs:
      "HDL cholesterol is the cholesterol that high-density lipoprotein carries. This lipoprotein returns cholesterol from tissues to the liver. People often call HDL good cholesterol.",
    whyItMatters:
      "Low HDL is under 40 mg/dL in men and under 50 in women. It is linked with higher heart risk and insulin resistance. Raising HDL with drugs did not cut heart attacks, so HDL is a signal rather than a target.",
    whatMovesIt:
      "Exercise, weight loss and quitting smoking raise it. Refined carbohydrates, inactivity, belly fat and smoking lower it.",
    ranges: [
      range(ncepAtp3, [60, null], [40, null], { sex: "male" }),
      range(ncepAtp3, [60, null], [50, null], { sex: "female" }),
    ],
    southAsianNote:
      "Low HDL is the most common lipid problem in Indian adults in the ICMR-INDIAB survey. The cut-offs are the same, so MediWise uses the same range here.",
    sources: [ncepAtp3, icmrIndiab2023, ahaAcc2018],
    core: true,
    direction: "low_is_bad",
  },
  {
    key: "triglycerides",
    name: "Triglycerides",
    shortName: "TG",
    aliases: [
      "triglyceride",
      "tg",
      "trigs",
      "serum triglycerides",
      "triglycerides serum",
      "s triglycerides",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: [
      { from: "mmol/L", factor: 88.57 },
      { from: "g/L", factor: 100 },
    ],
    precision: 0,
    description: "The main form of fat stored and carried in your blood.",
    whatItIs:
      "Triglycerides are fats made from the calories you do not burn right away. They rise after meals, so a fasting test is best.",
    whyItMatters:
      "Under 150 mg/dL is normal and 200 or above is high, by ATP III. High triglycerides with low HDL is a typical pattern of insulin resistance and raises heart risk.",
    whatMovesIt:
      "Sugar, refined carbohydrates, alcohol and weight gain raise them sharply. Exercise, weight loss, less sugar and alcohol, and omega-3 rich fish lower them.",
    ranges: [range(ncepAtp3, [null, 149], [null, 199])],
    southAsianNote:
      "High triglycerides with low HDL, sometimes called atherogenic dyslipidaemia, is common in Indians. The Lipid Association of India flags this pattern. The cut-offs are the same, so MediWise uses the same range here.",
    sources: [ncepAtp3, lai2023, ahaAcc2018],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "vldl_cholesterol",
    name: "VLDL cholesterol",
    shortName: "VLDL-C",
    aliases: [
      "vldl",
      "vldl c",
      "very low density lipoprotein",
      "very low density lipoprotein cholesterol",
      "cholesterol vldl",
      "vldl calculated",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: cholesterolConversions,
    precision: 0,
    description: "Cholesterol that triglyceride-rich particles carry.",
    whatItIs:
      "VLDL particles carry triglycerides from the liver to the body. Most labs estimate VLDL cholesterol as triglycerides divided by five.",
    whyItMatters:
      "Labs calculate it from triglycerides, so it rises and falls with them. It also counts toward non-HDL cholesterol, which tracks heart risk.",
    whatMovesIt:
      "Whatever moves triglycerides moves it. Sugar, alcohol and weight gain raise it, and exercise and weight loss lower it.",
    ranges: [range(ncepAtp3, [null, 30], [null, 40])],
    sources: [ncepAtp3],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "apolipoprotein_a1",
    name: "Apolipoprotein A1",
    shortName: "ApoA1",
    aliases: [
      "apo a1",
      "apoa1",
      "apo a 1",
      "apolipoprotein a 1",
      "apolipoprotein a i",
      "apo ai",
      "apolipoprotein a",
    ],
    category: "lipids",
    unit: "mg/dL",
    conversions: apoConversions,
    precision: 0,
    description: "The main protein in HDL particles.",
    whatItIs:
      "ApoA1 is the protein backbone of HDL particles. It roughly counts how much HDL you carry.",
    whyItMatters:
      "Low ApoA1 is linked with higher heart risk, much like low HDL. It is most useful in the ApoB to ApoA1 ratio.",
    whatMovesIt:
      "Exercise, weight loss and quitting smoking raise it. Inactivity, smoking and a high-sugar diet lower it.",
    ranges: [
      range(tietz2022, [104, null], [94, null], { sex: "male" }),
      range(tietz2022, [108, null], [97, null], { sex: "female" }),
    ],
    sources: [tietz2022],
    core: false,
    direction: "low_is_bad",
  },
  {
    key: "apolipoprotein_b",
    name: "Apolipoprotein B",
    shortName: "ApoB",
    aliases: ["apo b", "apob", "apolipoprotein b 100", "apo b 100", "apob100"],
    category: "lipids",
    unit: "mg/dL",
    conversions: apoConversions,
    precision: 0,
    description: "A count of the particles that can build plaque in arteries.",
    whatItIs:
      "Every LDL, VLDL and Lp(a) particle carries exactly one ApoB protein. Measuring ApoB counts the harmful particles directly.",
    whyItMatters:
      "ApoB predicts heart risk at least as well as LDL and better when triglycerides are high. ESC/EAS sets under 100 mg/dL for moderate risk, and AHA/ACC treats 130 or above as a risk enhancer.",
    whatMovesIt:
      "Genetics, saturated fat, insulin resistance and weight gain raise it. The steps that lower LDL and triglycerides lower it too.",
    ranges: [range(escEas2019, [null, 99], [null, 129])],
    sources: [escEas2019, ahaAcc2018],
    core: true,
    direction: "high_is_bad",
  },
  {
    key: "lipoprotein_a",
    name: "Lipoprotein(a)",
    shortName: "Lp(a)",
    aliases: ["lp a", "lpa", "lipoprotein a", "lipoprotein little a"],
    category: "lipids",
    unit: "mg/dL",
    conversions: [],
    precision: 1,
    description: "An inherited cholesterol particle that raises heart risk.",
    whatItIs:
      "Lp(a) is an LDL-like particle with an extra protein attached. Your genes mostly set its level, and it stays about the same for life.",
    whyItMatters:
      "A high level raises the risk of heart attack, stroke and aortic valve narrowing, even when LDL is good. The EAS calls under 30 mg/dL low and over 50 high.",
    whatMovesIt:
      "Diet and exercise barely change it. Knowing it matters because it makes controlling LDL, blood pressure and sugar more urgent. It is worth measuring once in adult life.",
    ranges: [range(easLpa2022, [null, 29], [null, 50])],
    southAsianNote:
      "South Asians have higher Lp(a) levels on average than white Europeans. The Lipid Association of India (LAI) counts 50 mg/dL or more as a risk enhancer. LAI advises measuring it at least once in every adult.",
    sources: [easLpa2022, lai2023, ahaAcc2018],
    core: true,
    direction: "high_is_bad",
  },
];
