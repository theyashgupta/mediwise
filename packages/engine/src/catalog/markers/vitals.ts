import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { accAha2017, ahaHeartRate, who2000 } = sources;

export const vitalMarkers: Marker[] = [
  {
    key: "height",
    name: "Height",
    aliases: ["ht", "body height", "standing height"],
    category: "vitals",
    unit: "cm",
    conversions: [{ from: "m", factor: 100 }],
    precision: 0,
    description: "Your height, as measured at the health check.",
    whatItIs:
      "Height is how tall you stand without shoes. The doctor or nurse measures it at the health check.",
    whyItMatters:
      "Height alone does not show a health risk. MediWise uses it with your weight to calculate your BMI.",
    whatMovesIt:
      "Adult height stays almost the same for many years. It can decrease a little with age.",
    ranges: [],
    sources: [who2000],
    core: false,
    direction: "both",
  },
  {
    key: "weight",
    name: "Weight",
    aliases: ["wt", "body weight", "bodyweight"],
    category: "vitals",
    unit: "kg",
    conversions: [
      { from: "lb", factor: 0.4536 },
      { from: "lbs", factor: 0.4536 },
    ],
    precision: 1,
    description: "Your body weight, as measured at the health check.",
    whatItIs: "Weight is your body mass on a scale. The health check measures it in kilograms.",
    whyItMatters:
      "Weight alone does not show a health risk. MediWise uses it with your height to calculate your BMI.",
    whatMovesIt:
      "Food, physical activity, sleep, body fluid and some medicines change your weight. A change over months tells more than one value.",
    ranges: [],
    sources: [who2000],
    core: false,
    direction: "both",
  },
  {
    key: "systolic_bp",
    name: "Systolic blood pressure",
    shortName: "Systolic BP",
    aliases: ["sbp", "systolic", "systolic pressure", "bp systolic"],
    category: "vitals",
    unit: "mmHg",
    conversions: [{ from: "mm Hg", factor: 1 }],
    precision: 0,
    description: "The top number of your blood pressure, when the heart beats.",
    whatItIs:
      "Systolic pressure is the pressure in your arteries when the heart pushes blood out. It is the top number of a reading such as 120/80.",
    whyItMatters:
      "High blood pressure increases the risk of stroke, heart attack and kidney disease. The ACC/AHA guideline calls under 120 normal and 130 or more high.",
    whatMovesIt:
      "Salt, alcohol, extra weight, stress and low activity increase it. One reading can be high from stress, so doctors confirm it on different days.",
    ranges: [range(accAha2017, [null, 119], [null, 139])],
    sources: [accAha2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "diastolic_bp",
    name: "Diastolic blood pressure",
    shortName: "Diastolic BP",
    aliases: ["dbp", "diastolic", "diastolic pressure", "bp diastolic"],
    category: "vitals",
    unit: "mmHg",
    conversions: [{ from: "mm Hg", factor: 1 }],
    precision: 0,
    description: "The bottom number of your blood pressure, when the heart rests.",
    whatItIs:
      "Diastolic pressure is the pressure in your arteries when the heart rests between beats. It is the bottom number of a reading such as 120/80.",
    whyItMatters:
      "A high value increases the risk of stroke and heart disease. The ACC/AHA guideline calls under 80 normal and 80 or more high.",
    whatMovesIt:
      "Salt, alcohol, extra weight and stress increase it. Doctors confirm a high value with readings on different days.",
    ranges: [range(accAha2017, [null, 79], [null, 89])],
    sources: [accAha2017],
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "pulse",
    name: "Pulse",
    aliases: ["pulse rate", "resting pulse", "radial pulse"],
    category: "vitals",
    unit: "bpm",
    conversions: [
      { from: "/min", factor: 1 },
      { from: "beats/min", factor: 1 },
      { from: "b/min", factor: 1 },
      { from: "per min", factor: 1 },
    ],
    precision: 0,
    description: "How many times your heart beats in one minute, felt at the wrist.",
    whatItIs:
      "Pulse is the number of heartbeats in one minute. The doctor counts it at the wrist while you rest.",
    whyItMatters:
      "A resting adult pulse is usually 60 to 100 beats a minute. A value outside this range needs a doctor's check, but fit people often have a lower pulse.",
    whatMovesIt:
      "Exercise, fever, caffeine, stress, dehydration and a high thyroid level raise it. Physical fitness and some heart medicines lower it.",
    ranges: [range(ahaHeartRate, [60, 100], [50, 110])],
    sources: [ahaHeartRate],
    core: false,
    direction: "both",
  },
];
