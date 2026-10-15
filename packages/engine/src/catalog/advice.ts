import type { Lifestyle, UrgentLimit } from "./schema.js";
import { sources } from "./sources.js";

const {
  aasld2023,
  accAha2017,
  acrGout2020,
  ada2025,
  ahaAcc2018,
  icmrNin2024,
  iomBVitamins1998,
  iomVitD2011,
  kdigo2024,
  kost1990,
  who2000,
} = sources;

const activity = "Walk briskly or do other activity on most days of the week.";
const lessSalt =
  "Use less salt. Eat fewer salty foods, such as chips, processed meat, pickles and papad.";
const weightLoss = "Weight loss when you are overweight";

const bloodSugar: Lifestyle = {
  side: "high",
  habits: [
    "Walk or do other activity for at least 150 minutes each week.",
    "Drink water in place of sweet drinks and packaged juice.",
    "Fill half your plate with vegetables. Eat less white rice, white bread and refined flour (maida).",
  ],
  raises: ["Sweet drinks and sweets", "Long hours of sitting", "Weight gain around the waist"],
  lowers: ["Regular activity", weightLoss, "Vegetables, whole grains, and lentils or beans (dal)"],
  source: ada2025.id,
};

const cholesterol: Lifestyle = {
  side: "high",
  habits: [
    "Cook with a little olive, mustard or canola oil in place of butter, ghee or hydrogenated fat (vanaspati).",
    "Eat more fibre from oats, lentils and beans (dal, rajma, chana), fruit and vegetables.",
    activity,
  ],
  raises: [
    "Butter, clarified butter (ghee) and fried snacks",
    "Fatty red meat and full-fat dairy",
    "Weight gain",
  ],
  lowers: ["Fibre from oats, lentils and beans (dal)", "Regular activity", weightLoss],
  source: ahaAcc2018.id,
};

const triglycerides: Lifestyle = {
  side: "high",
  habits: [
    "Eat fewer sweets and sweet drinks, and less white rice, white bread and refined flour (maida).",
    "Drink less alcohol, or stop.",
    activity,
  ],
  raises: ["Sugar, white rice and refined flour (maida)", "Alcohol", "Weight gain"],
  lowers: ["Regular activity", "Less sugar and alcohol", weightLoss],
  source: ahaAcc2018.id,
};

const liver: Lifestyle = {
  side: "high",
  habits: [
    "Drink much less alcohol, or stop.",
    "If you are overweight, losing weight slowly can help your liver.",
    activity,
  ],
  raises: ["Alcohol", "Weight gain around the waist", "Sweet drinks"],
  lowers: ["Less alcohol", weightLoss, "Regular activity"],
  source: aasld2023.id,
};

const bloodPressure: Lifestyle = {
  side: "high",
  habits: [lessSalt, activity, "Drink less alcohol, or stop."],
  raises: ["Salt and salty packaged food", "Alcohol", "Weight gain"],
  lowers: ["Less salt", "Regular activity", "Fruit and vegetables"],
  source: accAha2017.id,
};

const iron: Lifestyle = {
  side: "low",
  habits: [
    "Eat iron-rich foods, such as leafy greens, lentils and beans (dal), eggs, meat or fish.",
    "Eat fruit with vitamin C, such as oranges, guava or Indian gooseberry (amla), with your meals.",
    "Do not drink tea or coffee for one hour before or after a meal.",
  ],
  raises: ["Iron-rich foods", "Fruit with vitamin C at meals"],
  lowers: ["Tea or coffee with meals", "Heavy periods", "Blood donation"],
  source: icmrNin2024.id,
};

export const lifestyle: Record<string, Lifestyle> = {
  glucose_fasting: bloodSugar,
  glucose_postprandial: bloodSugar,
  glucose_random: bloodSugar,
  hba1c: bloodSugar,
  insulin_fasting: bloodSugar,
  homa_ir: bloodSugar,
  ldl_cholesterol: cholesterol,
  total_cholesterol: cholesterol,
  non_hdl_cholesterol: cholesterol,
  apolipoprotein_b: cholesterol,
  triglycerides,
  tg_hdl_ratio: triglycerides,
  hdl_cholesterol: {
    side: "low",
    habits: [activity, "If you smoke, get help to stop.", "Keep a healthy weight."],
    raises: ["Regular activity", "Not smoking", weightLoss],
    lowers: ["Smoking", "Long hours of sitting", "Weight gain"],
    source: ahaAcc2018.id,
  },
  alt: liver,
  ggt: liver,
  uric_acid: {
    side: "high",
    habits: [
      "Drink less alcohol, especially beer.",
      "Drink water in place of sweet drinks and packaged juice.",
      "Eat less red meat, organ meat and seafood.",
    ],
    raises: ["Alcohol, especially beer", "Sweet drinks", "Red meat, organ meat and seafood"],
    lowers: ["Water in place of sweet drinks", "Less alcohol", weightLoss],
    source: acrGout2020.id,
  },
  systolic_bp: bloodPressure,
  diastolic_bp: bloodPressure,
  bmi: {
    side: "high",
    habits: [
      activity,
      "Eat smaller portions of sweets, fried snacks, white rice, white bread and refined flour (maida).",
      "Drink water in place of sweet drinks.",
    ],
    raises: ["Sweet drinks and fried snacks", "Long hours of sitting", "Large portions"],
    lowers: ["Regular activity", "Smaller portions", "Vegetables and whole grains"],
    source: who2000.id,
  },
  urine_acr: {
    side: "high",
    habits: [lessSalt, "If you smoke, get help to stop.", activity],
    raises: ["High blood sugar", "High blood pressure", "Smoking"],
    lowers: ["Less salt", "Not smoking", "Blood sugar and blood pressure under control"],
    source: kdigo2024.id,
  },
  vitamin_d: {
    side: "low",
    habits: [
      "Eat foods with vitamin D, such as eggs, oily fish and fortified milk.",
      "Spend some time outdoors in daylight on most days.",
    ],
    raises: ["Time outdoors in daylight", "Eggs, oily fish and fortified milk"],
    lowers: ["Little time outdoors", "Clothes that cover most of the skin", "Weight gain"],
    source: iomVitD2011.id,
  },
  vitamin_b12: {
    side: "low",
    habits: [
      "Include milk, yogurt (curd) or cheese (paneer) every day.",
      "If you eat eggs, fish or meat, include them a few times a week.",
      "If you eat no animal foods, ask your doctor about fortified foods.",
    ],
    raises: ["Milk, yogurt (curd) and cheese (paneer)", "Eggs, fish and meat", "Fortified foods"],
    lowers: ["Little or no milk, eggs, fish or meat"],
    source: iomBVitamins1998.id,
  },
  folate: {
    side: "low",
    habits: [
      "Eat leafy greens, such as spinach, kale or fenugreek leaves (methi), on most days.",
      "Include lentils, beans and chickpeas (dal, rajma, chana).",
      "Eat fresh fruit, such as oranges.",
    ],
    raises: ["Green leafy vegetables", "Lentils and beans (dal, rajma)", "Fresh fruit"],
    lowers: ["Few vegetables and fruit", "Heavy alcohol use", "Vegetables cooked for a long time"],
    source: iomBVitamins1998.id,
  },
  ferritin: iron,
  iron,
};

const glucose: UrgentLimit = {
  below: { value: 54, source: ada2025.id },
  above: { value: 484, source: kost1990.id },
};

export const urgentLimits: Record<string, UrgentLimit> = {
  potassium: {
    below: { value: 2.8, source: kost1990.id },
    above: { value: 6.2, source: kost1990.id },
  },
  sodium: {
    below: { value: 120, source: kost1990.id },
    above: { value: 158, source: kost1990.id },
  },
  calcium: { below: { value: 6, source: kost1990.id }, above: { value: 13, source: kost1990.id } },
  glucose_fasting: glucose,
  glucose_random: glucose,
  glucose_postprandial: glucose,
  hemoglobin: {
    below: { value: 6.6, source: kost1990.id },
    above: { value: 19.9, source: kost1990.id },
  },
  platelet_count: {
    below: { value: 37, source: kost1990.id },
    above: { value: 910, source: kost1990.id },
  },
  wbc_count: {
    below: { value: 2, source: kost1990.id },
    above: { value: 37, source: kost1990.id },
  },
  creatinine: { above: { value: 7.4, source: kost1990.id } },
  egfr: { below: { value: 15, source: kdigo2024.id } },
  systolic_bp: { above: { value: 180, source: accAha2017.id } },
  diastolic_bp: { above: { value: 120, source: accAha2017.id } },
};
