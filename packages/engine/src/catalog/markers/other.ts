import { range } from "../range.js";
import type { Marker, TextRule } from "../schema.js";
import { sources } from "../sources.js";

const { acipHepB2018, atlanta2012, catalona1991, izincg2012, tietz2022, whoHepTesting2017 } =
  sources;

/** Builds the hepatitis screen rules, with the follow-up for a reactive result. */
function hepatitisTextRules(followUp: NonNullable<TextRule["followUp"]>): TextRule[] {
  return [
    { pattern: "^(weakly )?(reactive|positive)", status: "risk", followUp },
    { pattern: "^(non[\\s-]*reactive|negative)", status: "optimal" },
  ];
}

const enzymeConversions = [{ from: "IU/L", factor: 1 }];

export const otherMarkers: Marker[] = [
  {
    key: "ldh",
    name: "Lactate dehydrogenase",
    shortName: "LDH",
    aliases: ["lactate dehydrogenase", "lactic dehydrogenase", "ldh total", "serum ldh", "ld"],
    category: "other",
    unit: "U/L",
    conversions: enzymeConversions,
    precision: 0,
    description: "An enzyme that damaged cells anywhere in the body release.",
    whatItIs:
      "LDH is an enzyme found in almost every tissue, including blood cells, liver, muscle and heart. It leaks into blood when cells rupture.",
    whyItMatters:
      "A raised LDH says some tissue is under stress but not which one. It is most useful alongside other markers, such as red cell breakdown markers.",
    whatMovesIt:
      "Hard exercise, muscle injury, red cell breakdown and liver disease raise it. A sample with burst red cells raises it falsely.",
    ranges: [range(tietz2022, [null, 243], [null, 300])],
    sources: [tietz2022],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "ck_total",
    name: "Creatine kinase",
    shortName: "CK",
    aliases: [
      "ck",
      "cpk",
      "creatine kinase",
      "creatine phosphokinase",
      "ck total",
      "cpk total",
      "total ck",
    ],
    category: "other",
    unit: "U/L",
    conversions: enzymeConversions,
    precision: 0,
    description: "A muscle enzyme that rises after hard exercise or muscle injury.",
    whatItIs:
      "CK is an enzyme found mainly in skeletal muscle, the heart and the brain. It leaks into blood when muscle is strained or damaged.",
    whyItMatters:
      "A high CK after a workout is normal and settles in days. A high CK without exercise, or with muscle pain on a statin, deserves a doctor's view.",
    whatMovesIt:
      "Hard or unfamiliar exercise, injury, injections and some medicines including statins raise it. More muscle mass raises the usual baseline.",
    ranges: [
      range(tietz2022, [null, 308], [null, 600], { sex: "male" }),
      range(tietz2022, [null, 192], [null, 400], { sex: "female" }),
    ],
    sources: [tietz2022],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "amylase",
    name: "Amylase",
    aliases: ["serum amylase", "amylase serum", "s amylase", "total amylase"],
    category: "other",
    unit: "U/L",
    conversions: enzymeConversions,
    precision: 0,
    description: "A digestive enzyme from the pancreas and salivary glands.",
    whatItIs:
      "Amylase digests starch. The pancreas and the salivary glands make it. Small amounts circulate in blood.",
    whyItMatters:
      "A level more than three times the upper limit, with belly pain, supports acute pancreatitis under the Atlanta criteria. Mild rises have many harmless causes.",
    whatMovesIt:
      "Pancreatitis, gallstones, salivary gland swelling and heavy alcohol raise it. Lipase is more specific to the pancreas.",
    ranges: [range(tietz2022, [null, 100], [null, 300])],
    sources: [tietz2022, atlanta2012],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "lipase",
    name: "Lipase",
    aliases: ["serum lipase", "lipase serum", "s lipase", "pancreatic lipase"],
    category: "other",
    unit: "U/L",
    conversions: enzymeConversions,
    precision: 0,
    description: "A fat-digesting enzyme that the pancreas makes.",
    whatItIs:
      "Lipase helps digest fat and comes almost entirely from the pancreas. It leaks into blood when the pancreas is inflamed.",
    whyItMatters:
      "Lipase above three times the upper limit, with typical pain, is a key sign of acute pancreatitis. This sign is part of the Atlanta criteria. It stays raised longer than amylase.",
    whatMovesIt:
      "Pancreatitis, gallstones, heavy alcohol and very high triglycerides raise it. Kidney disease raises it a little because the kidneys clear it.",
    ranges: [range(tietz2022, [null, 60], [null, 180])],
    sources: [tietz2022, atlanta2012],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "psa_total",
    name: "Prostate specific antigen",
    shortName: "PSA",
    aliases: [
      "psa",
      "total psa",
      "psa total",
      "serum psa",
      "tpsa",
      "prostate specific antigen total",
    ],
    category: "other",
    unit: "ng/mL",
    conversions: [{ from: "µg/L", factor: 1 }],
    precision: 2,
    description: "A prostate protein used to screen for prostate problems.",
    whatItIs:
      "PSA is a protein that the prostate gland makes, and a little enters the blood. Levels rise with prostate size and with age.",
    whyItMatters:
      "The classic screening cut-off of 4 ng/mL comes from Catalona's 1991 study. Values from 4 to 10 are a grey zone. A raised PSA has many harmless causes, so decisions belong with a doctor.",
    whatMovesIt:
      "Prostate enlargement, infection, recent ejaculation, cycling and a prostate exam raise it. Some prostate medicines lower it by about half.",
    ranges: [range(catalona1991, [null, 4.0], [null, 10.0], { sex: "male", ageMin: 40 })],
    sources: [catalona1991],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "zinc",
    name: "Zinc",
    shortName: "Zn",
    aliases: ["serum zinc", "zn", "zinc serum", "s zinc", "plasma zinc"],
    category: "other",
    unit: "µg/dL",
    conversions: [{ from: "µmol/L", factor: 6.54 }],
    precision: 0,
    description: "A mineral for immunity, wound healing, taste and skin.",
    whatItIs:
      "Zinc is a trace mineral that hundreds of enzymes use, including those for immunity and healing. Blood zinc falls after meals and later in the day.",
    whyItMatters:
      "Low zinc weakens immunity, slows healing and can cause hair loss and poor taste. IZiNCG cut-offs are 74 µg/dL for men and 70 for women in a morning fasting sample.",
    whatMovesIt:
      "Diets high in phytates from unrefined grains and pulses, diarrhoea, alcohol and inflammation lower it. Meat, seafood, dairy and supplements raise it.",
    ranges: [
      range(izincg2012, [74, null], [61, null], { sex: "male", ageMin: 10 }),
      range(izincg2012, [70, null], [59, null], { sex: "female", ageMin: 10 }),
    ],
    sources: [izincg2012],
    core: false,
    direction: "low_is_bad",
  },
  {
    key: "copper",
    name: "Copper",
    shortName: "Cu",
    aliases: ["serum copper", "cu", "copper serum", "s copper", "plasma copper"],
    category: "other",
    unit: "µg/dL",
    conversions: [{ from: "µmol/L", factor: 6.355 }],
    precision: 0,
    description: "A trace mineral for blood, nerves and connective tissue.",
    whatItIs:
      "The body needs copper, a trace mineral, to use iron, build connective tissue and protect nerves. In blood, a protein called ceruloplasmin carries most of it.",
    whyItMatters:
      "Low copper can cause anaemia and nerve problems, sometimes from taking too much zinc. High copper often reflects inflammation, pregnancy or estrogen use.",
    whatMovesIt:
      "High-dose zinc supplements and gut surgery lower it. Inflammation, pregnancy and oral contraceptives raise it.",
    ranges: [
      range(tietz2022, [70, 140], [60, 160], { sex: "male" }),
      range(tietz2022, [80, 155], [70, 175], { sex: "female" }),
    ],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "hbsag",
    name: "Hepatitis B surface antigen",
    shortName: "HBsAg",
    aliases: [
      "australia antigen",
      "hbsag qualitative",
      "hbs ag",
      "hbsag screening",
      "hbsag rapid",
      "hepatitis b antigen",
    ],
    category: "other",
    unit: "text",
    conversions: [],
    precision: 0,
    description: "A test for a current hepatitis B infection.",
    whatItIs:
      "HBsAg is a protein on the surface of the hepatitis B virus. The lab reports it as reactive or non-reactive.",
    whyItMatters:
      "A reactive result means the virus is in your blood now. Hepatitis B can damage the liver over many years, and a doctor must confirm the result.",
    whatMovesIt:
      "Infection with hepatitis B makes it reactive. Most adults clear a new infection within 6 months, and some carry the virus for life.",
    ranges: [],
    textRules: hepatitisTextRules({
      title: "Ask your doctor about a confirmatory HBsAg test",
      why: "HBsAg is reactive. This result can mean that the hepatitis B virus is in your blood now.",
      next: "Ask your doctor about a confirmatory test. Do not start treatment before your doctor confirms the result.",
    }),
    sources: [whoHepTesting2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "anti_hbs",
    name: "Hepatitis B surface antibody",
    shortName: "Anti-HBs",
    aliases: [
      "anti hbs titre",
      "anti hbs titer",
      "anti hbs antibody",
      "hbsab",
      "hbs antibody",
      "hepatitis b antibody",
    ],
    category: "other",
    unit: "mIU/mL",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 1,
    description: "Shows whether you are protected against hepatitis B.",
    whatItIs:
      "Anti-HBs is the antibody against the hepatitis B surface protein. The vaccine or a past infection that cleared makes it.",
    whyItMatters:
      "A level of 10 mIU/mL or more means you are protected. Below 10 mIU/mL, ask your doctor if you need the vaccine or a booster dose.",
    whatMovesIt:
      "The hepatitis B vaccine and a cleared infection raise it. The level falls slowly over the years after vaccination.",
    ranges: [range(acipHepB2018, [10, null], [0, null], { ageMin: 0 })],
    textRules: [
      {
        pattern: /^<\s*(\d(\.\d+)?|10(\.0+)?)(?![\d.])/.source,
        status: "watch",
        followUp: {
          title: "Ask your doctor about a hepatitis B booster dose",
          why: "Your hepatitis B antibody level is low. Anti-HBs below 10 mIU/mL can mean that you are not protected against hepatitis B.",
          next: "Ask your doctor about a booster dose.",
        },
      },
    ],
    sources: [acipHepB2018],
    core: false,
    direction: "low_is_bad",
  },
  {
    key: "hcv_antibody",
    name: "Hepatitis C antibody",
    shortName: "Anti-HCV",
    aliases: ["hcv igg", "anti hcv igg", "hcv antibody", "hcv ab", "hepatitis c virus antibody"],
    category: "other",
    unit: "text",
    conversions: [],
    precision: 0,
    description: "A test for a past or current hepatitis C infection.",
    whatItIs:
      "This test finds antibodies the body makes against the hepatitis C virus. The lab reports it as reactive or non-reactive.",
    whyItMatters:
      "A reactive result means you had the virus at some time. A second test, HCV RNA, shows if the virus is still in your blood.",
    whatMovesIt:
      "Contact with infected blood, for example through shared needles, causes the infection. The antibodies usually stay after the virus clears, with or without treatment.",
    ranges: [],
    textRules: hepatitisTextRules({
      title: "Ask your doctor about an HCV RNA test for your reactive Anti-HCV",
      why: "Anti-HCV is reactive. This result shows that you had the hepatitis C virus at some time.",
      next: "Ask your doctor about an HCV RNA test. This test shows if the virus is in your blood now.",
    }),
    sources: [whoHepTesting2017],
    core: false,
    direction: "high_is_bad",
  },
];
