import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { endoAdrenal2016, endoProlactin2011, endoTestosterone2018, tietz2022, travison2017 } =
  sources;

export const hormoneMarkers: Marker[] = [
  {
    key: "cortisol",
    name: "Cortisol (morning)",
    aliases: [
      "cortisol",
      "serum cortisol",
      "s cortisol",
      "cortisol serum",
      "morning cortisol",
      "cortisol morning",
      "cortisol am",
      "cortisol 8 am",
    ],
    category: "hormones",
    unit: "µg/dL",
    conversions: [{ from: "nmol/L", factor: 0.03625 }],
    precision: 1,
    description: "The main stress hormone, highest in the morning.",
    whatItIs:
      "The adrenal glands make cortisol. It helps control blood sugar, blood pressure and the stress response. It peaks soon after waking and falls through the day, so the morning value is the standard.",
    whyItMatters:
      "A very low morning cortisol, under about 5 µg/dL, can signal adrenal insufficiency, per the Endocrine Society. A high value needs specific follow-up tests before anyone calls it excess.",
    whatMovesIt:
      "Time of day, stress, poor sleep, illness and steroid medicines or creams move it. Oral contraceptives and pregnancy raise total cortisol by raising its carrier protein.",
    ranges: [range(tietz2022, [6.2, 19.4], [5.0, 25.0])],
    sources: [tietz2022, endoAdrenal2016],
    core: false,
    direction: "both",
  },
  {
    key: "testosterone_total",
    name: "Total testosterone",
    aliases: [
      "testosterone",
      "testosterone total",
      "serum testosterone",
      "s testosterone",
      "testosterone serum",
    ],
    category: "hormones",
    unit: "ng/dL",
    conversions: [{ from: "nmol/L", factor: 28.84 }],
    precision: 0,
    description: "The main male sex hormone, also important in women.",
    whatItIs:
      "In men, the testes make most testosterone. In women, the ovaries and adrenals make small amounts. It supports muscle, bone, mood and libido.",
    whyItMatters:
      "In men, the Endocrine Society uses 264 ng/dL as the lower limit, based on harmonised ranges in healthy young men. In women, high testosterone is a common feature of PCOS.",
    whatMovesIt:
      "Obesity, poor sleep, heavy alcohol, opioids and illness lower it in men. It peaks in the morning, so you should test before 10 am.",
    ranges: [
      range(travison2017, [264, 916], [200, 1100], { sex: "male" }),
      range(tietz2022, [15, 70], [8, 90], { sex: "female" }),
    ],
    sources: [travison2017, endoTestosterone2018, tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "testosterone_free",
    name: "Free testosterone",
    aliases: [
      "free testosterone",
      "testosterone free",
      "serum free testosterone",
      "calculated free testosterone",
      "free testosterone calculated",
    ],
    category: "hormones",
    unit: "pg/mL",
    conversions: [
      { from: "pmol/L", factor: 0.2884 },
      { from: "ng/dL", factor: 10 },
    ],
    precision: 1,
    description: "The share of testosterone not bound to carrier proteins.",
    whatItIs:
      "SHBG and albumin bind most testosterone, and a small free part acts on tissues. Labs measure it directly or calculate it from total testosterone, SHBG and albumin.",
    whyItMatters:
      "It helps when total testosterone is borderline or SHBG is unusual, as in obesity or ageing. The Endocrine Society recommends it in those situations.",
    whatMovesIt:
      "High SHBG lowers it, and low SHBG from obesity or insulin resistance raises the free share. Sleep, weight and alcohol move it the same way as total testosterone.",
    ranges: [
      range(tietz2022, [50, 210], [35, 250], { sex: "male" }),
      range(tietz2022, [0.6, 6.8], [0.3, 9.0], { sex: "female" }),
    ],
    sources: [tietz2022, endoTestosterone2018],
    core: false,
    direction: "both",
  },
  {
    key: "shbg",
    name: "Sex hormone binding globulin",
    shortName: "SHBG",
    aliases: [
      "sex hormone binding globulin",
      "serum shbg",
      "shbg serum",
      "sex hormone binding protein",
    ],
    category: "hormones",
    unit: "nmol/L",
    conversions: [],
    precision: 1,
    description: "The protein that carries sex hormones in your blood.",
    whatItIs:
      "The liver makes SHBG, which binds testosterone and estradiol. It decides how much of these hormones is free to act.",
    whyItMatters:
      "Low SHBG is a marker of insulin resistance and fatty liver. High SHBG can make total testosterone look fine while free testosterone is low.",
    whatMovesIt:
      "Insulin resistance, obesity and androgens lower it. Ageing, an overactive thyroid, liver disease and oral estrogens raise it.",
    ranges: [
      range(tietz2022, [10, 57], [8, 70], { sex: "male" }),
      range(tietz2022, [18, 144], [14, 160], { sex: "female" }),
    ],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "prolactin",
    name: "Prolactin",
    shortName: "PRL",
    aliases: ["prl", "serum prolactin", "prolactin serum", "s prolactin", "prolactin level"],
    category: "hormones",
    unit: "ng/mL",
    conversions: [
      { from: "µIU/mL", factor: 0.0472 },
      { from: "mIU/L", factor: 0.0472 },
    ],
    precision: 1,
    description: "A pituitary hormone for milk production that affects fertility.",
    whatItIs:
      "The pituitary gland makes prolactin, which triggers milk production after childbirth. Outside pregnancy and breastfeeding it stays low.",
    whyItMatters:
      "A high prolactin can cause irregular periods, low libido and infertility. The Endocrine Society advises excluding stress, medicines and an underactive thyroid before further tests.",
    whatMovesIt:
      "Stress, the blood draw itself, sleep, pregnancy, some antipsychotic and anti-nausea medicines and an underactive thyroid raise it. Doctors often order a repeat test at rest for a mildly high value.",
    ranges: [
      range(tietz2022, [null, 15.2], [null, 25], { sex: "male" }),
      range(tietz2022, [null, 23.3], [null, 35], { sex: "female" }),
    ],
    sources: [tietz2022, endoProlactin2011],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "lh",
    name: "Luteinizing hormone",
    shortName: "LH",
    aliases: ["luteinizing hormone", "luteinising hormone", "serum lh", "lh serum"],
    category: "hormones",
    unit: "mIU/mL",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 1,
    description: "A pituitary hormone that drives the testes and ovaries.",
    whatItIs:
      "The pituitary gland releases LH. LH tells the testes to make testosterone and the ovaries to ovulate. In women it changes through the cycle and surges before ovulation.",
    whyItMatters:
      "In men, LH tells whether low testosterone starts in the testes or in the brain. In women, doctors read it by cycle day, so this catalog gives a calibrated range for men only.",
    whatMovesIt:
      "Testicular or ovarian problems raise it, and menopause raises it a lot. Pituitary problems, heavy training and very low body fat lower it.",
    ranges: [range(tietz2022, [1.7, 8.6], [1.2, 12], { sex: "male" })],
    sources: [tietz2022, endoTestosterone2018],
    core: false,
    direction: "both",
  },
  {
    key: "fsh",
    name: "Follicle stimulating hormone",
    shortName: "FSH",
    aliases: ["follicle stimulating hormone", "serum fsh", "fsh serum", "follitropin"],
    category: "hormones",
    unit: "mIU/mL",
    conversions: [{ from: "IU/L", factor: 1 }],
    precision: 1,
    description: "A pituitary hormone for sperm and egg development.",
    whatItIs:
      "The pituitary gland releases FSH, which supports sperm production in men and egg development in women. In women it changes through the cycle.",
    whyItMatters:
      "A high FSH in men suggests reduced sperm production, and in women it signals falling ovarian reserve or menopause. Doctors read women's values by cycle day, so this catalog gives a calibrated range for men only.",
    whatMovesIt:
      "Testicular injury, chemotherapy and menopause raise it. Pituitary problems and very low body weight lower it.",
    ranges: [range(tietz2022, [1.5, 12.4], [1.0, 18], { sex: "male" })],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "estradiol",
    name: "Estradiol",
    shortName: "E2",
    aliases: ["e2", "oestradiol", "serum estradiol", "estradiol e2", "17 beta estradiol"],
    category: "hormones",
    unit: "pg/mL",
    conversions: [{ from: "pmol/L", factor: 0.2724 }],
    precision: 1,
    description: "The main estrogen, important for bones in both sexes.",
    whatItIs:
      "Estradiol is the main estrogen. In women the ovaries make it, and in men the body makes it from testosterone. In women it rises and falls through the cycle.",
    whyItMatters:
      "In men, high estradiol often occurs with excess body fat and can cause breast tissue growth. Women's values depend on cycle day, so this catalog gives a calibrated range for men only.",
    whatMovesIt:
      "Body fat, alcohol and testosterone therapy raise it in men. Menopause, very low body fat and some breast cancer medicines lower it in women.",
    ranges: [range(tietz2022, [11, 44], [8, 60], { sex: "male" })],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
];
