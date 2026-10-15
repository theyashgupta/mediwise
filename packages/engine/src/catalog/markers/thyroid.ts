import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { ata2014, ataAace2012, indiaThyroid2013, tietz2022 } = sources;

export const thyroidMarkers: Marker[] = [
  {
    key: "tsh",
    name: "Thyroid stimulating hormone",
    shortName: "TSH",
    aliases: [
      "tsh",
      "thyrotropin",
      "tsh ultrasensitive",
      "ultrasensitive tsh",
      "us tsh",
      "serum tsh",
      "tsh 3rd generation",
      "tsh third generation",
    ],
    category: "thyroid",
    unit: "µIU/mL",
    conversions: [
      { from: "mIU/L", factor: 1 },
      { from: "mU/L", factor: 1 },
    ],
    precision: 2,
    description: "The brain's signal to the thyroid, the best single thyroid marker.",
    whatItIs:
      "The pituitary gland makes TSH to tell the thyroid how much hormone to release. When thyroid output drops, TSH rises, and when output is high, TSH falls.",
    whyItMatters:
      "TSH is the most sensitive screen for an underactive or overactive thyroid. The ATA and AACE use 0.45 to 4.12 as the reference range from a large US survey. A TSH above 10 usually prompts treatment.",
    whatMovesIt:
      "Thyroid disease, iodine intake, pregnancy, recent illness and biotin supplements move it. It also varies through the day, so a repeat test is best at a similar time.",
    ranges: [range(ataAace2012, [0.45, 4.12], [0.1, 10.0])],
    southAsianNote:
      "Hypothyroidism is common in India. A survey in eight Indian cities found it in about 1 in 10 adults, a third of them undiagnosed. The cut-offs are the same, so MediWise uses the same range here.",
    sources: [ataAace2012, ata2014, indiaThyroid2013],
    core: true,
    direction: "both",
  },
  {
    key: "free_t4",
    name: "Free T4",
    shortName: "FT4",
    aliases: [
      "ft4",
      "free thyroxine",
      "free t4 ft4",
      "serum free t4",
      "free thyroxine ft4",
      "t4 free",
    ],
    category: "thyroid",
    unit: "ng/dL",
    conversions: [{ from: "pmol/L", factor: 0.0777 }],
    precision: 2,
    description: "The active, unbound form of the main thyroid hormone.",
    whatItIs:
      "T4 is the main hormone the thyroid releases, and the free part is the share not bound to proteins. It is available to tissues and converts into T3.",
    whyItMatters:
      "With TSH it tells whether a thyroid problem is mild or established. A low free T4 with high TSH confirms an underactive thyroid.",
    whatMovesIt:
      "Thyroid disease, thyroid medicine dose and timing, pregnancy and biotin supplements move it. Severe illness can lower it for a while.",
    ranges: [range(tietz2022, [0.9, 1.7], [0.7, 2.0])],
    sources: [tietz2022, ata2014],
    core: false,
    direction: "both",
  },
  {
    key: "free_t3",
    name: "Free T3",
    shortName: "FT3",
    aliases: [
      "ft3",
      "free triiodothyronine",
      "free t3 ft3",
      "serum free t3",
      "free triiodothyronine ft3",
      "t3 free",
    ],
    category: "thyroid",
    unit: "pg/mL",
    conversions: [{ from: "pmol/L", factor: 0.651 }],
    precision: 2,
    description: "The free form of the most active thyroid hormone.",
    whatItIs:
      "T3 is the thyroid hormone that acts on cells. The body makes most of it by converting T4. The free part is the share not bound to proteins.",
    whyItMatters:
      "Free T3 is most useful when TSH is low, to spot an overactive thyroid. In an underactive thyroid it often stays normal until late.",
    whatMovesIt:
      "An overactive thyroid raises it. Calorie restriction, severe illness and some medicines lower it.",
    ranges: [range(tietz2022, [2.3, 4.2], [2.0, 4.8])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "total_t4",
    name: "Total T4",
    shortName: "T4",
    aliases: ["t4", "thyroxine", "total thyroxine", "t4 total", "serum t4", "thyroxine t4"],
    category: "thyroid",
    unit: "µg/dL",
    conversions: [{ from: "nmol/L", factor: 0.0777 }],
    precision: 1,
    description: "All the T4 thyroid hormone in blood, bound and free.",
    whatItIs:
      "Total T4 includes the hormone bound to carrier proteins and the small free part. Many Indian full body panels report total T3 and T4 with TSH.",
    whyItMatters:
      "It helps confirm a thyroid problem that TSH flags. Changes in carrier proteins can shift it without any thyroid issue, so free T4 is more precise.",
    whatMovesIt:
      "Thyroid disease and thyroid medicine move it. Pregnancy and oral contraceptives raise carrier proteins and so increase it.",
    ranges: [range(tietz2022, [5.0, 12.0], [4.5, 13.5])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "total_t3",
    name: "Total T3",
    shortName: "T3",
    aliases: [
      "t3",
      "triiodothyronine",
      "total triiodothyronine",
      "t3 total",
      "serum t3",
      "triiodothyronine t3",
    ],
    category: "thyroid",
    unit: "ng/dL",
    conversions: [{ from: "nmol/L", factor: 65.1 }],
    precision: 0,
    description: "All the T3 thyroid hormone in blood, bound and free.",
    whatItIs:
      "Total T3 includes the T3 bound to carrier proteins and the free part. Most Indian thyroid profiles report it.",
    whyItMatters:
      "A high value supports an overactive thyroid. A low value is common during illness or dieting and does not by itself mean thyroid disease.",
    whatMovesIt:
      "An overactive thyroid raises it. Illness, fasting and some medicines lower it, and pregnancy raises carrier proteins.",
    ranges: [range(tietz2022, [80, 200], [60, 220])],
    sources: [tietz2022],
    core: false,
    direction: "both",
  },
  {
    key: "anti_tpo",
    name: "Anti-TPO antibodies",
    shortName: "Anti-TPO",
    aliases: [
      "anti tpo",
      "tpo antibodies",
      "anti thyroid peroxidase",
      "anti thyroid peroxidase antibodies",
      "thyroid peroxidase antibody",
      "anti tpo antibody",
      "tpo ab",
      "atpo",
      "anti microsomal antibody",
    ],
    category: "thyroid",
    unit: "IU/mL",
    conversions: [{ from: "U/mL", factor: 1 }],
    precision: 1,
    description: "Antibodies that attack the thyroid, the mark of Hashimoto's.",
    whatItIs:
      "Anti-TPO antibodies target thyroid peroxidase, an enzyme the thyroid needs to make hormone. They are the usual sign of autoimmune thyroid disease.",
    whyItMatters:
      "A positive value means a higher chance that the thyroid slows over the years. For this reason, TSH is worth checking regularly. Cut-offs differ between test kits, so the lab range is the reference for a borderline value.",
    whatMovesIt:
      "Autoimmune thyroid disease raises it, and it is more common in women and after pregnancy. Levels change slowly and do not need repeating often.",
    ranges: [range(tietz2022, [null, 34], [null, 50])],
    southAsianNote:
      "The eight-city Indian survey found anti-TPO antibodies in about 1 in 5 adults, higher than in many Western studies. No source publishes a separate range, so MediWise uses the same range here.",
    sources: [tietz2022, ataAace2012, indiaThyroid2013],
    core: false,
    direction: "high_is_bad",
  },
];
