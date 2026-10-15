const english = {
  dosage: ["doses?", "dosages?", "mg", "mcg", "iu", "tablets?", "capsules?", "pills?"],
  medicine: [
    "medicines?",
    "medications?",
    "drugs?",
    "statins?",
    "atorvastatin",
    "rosuvastatin",
    "simvastatin",
    "metformin",
    "glimepiride",
    "insulin injections?",
    "aspirin",
    "clopidogrel",
    "amlodipine",
    "telmisartan",
    "losartan",
    "allopurinol",
    "febuxostat",
    "ezetimibe",
    "semaglutide",
    "ozempic",
    "levothyroxine",
    "thyronorm",
    "eltroxin",
    "paracetamol",
    "ibuprofen",
    "antibiotics?",
  ],
  dietPlan: [
    "diets?",
    "meal plans?",
    "calori\\w*",
    "keto",
    "fasting plans?",
    "intermittent fasting",
    "detox",
  ],
  diagnosis: [
    "diabet\\w*",
    "prediabet\\w*",
    "anaemi\\w*",
    "anemi\\w*",
    "hypothyroid\\w*",
    "hyperthyroid\\w*",
    "hypertension",
    "fatty liver",
    "cirrhosis",
    "cancers?",
    "tumou?rs?",
    "malignan\\w*",
    "gout",
    "deficien\\w*",
    "diagnos\\w*",
    "diseases?",
    "disorders?",
    "syndromes?",
    "you have",
  ],
};

const hindi = [
  "खुराक",
  "गोली",
  "दवा",
  "डाइट",
  "मधुमेह",
  "डायबिटीज",
  "एनीमिया",
  "कैंसर",
  "निदान",
  "बीमारी",
  "टैबलेट",
  "कैप्सूल",
  "मिलीग्राम",
  "डोज",
  "डायट",
  "इंजेक्शन",
  "गाउट",
  "फैटी लिवर",
];

const englishPattern = new RegExp(`\\b(?:${Object.values(english).flat().join("|")})\\b`, "gi");

/**
 * Lists every dosage, medicine, diet plan or diagnosis word in a text a user can read.
 *
 * @remarks
 * Hindi words match as NFC substrings, because `\b` in a JavaScript regex knows only ASCII word characters.
 */
export function forbiddenWords(text: string): string[] {
  const normalized = text.normalize("NFC");
  return [
    ...(normalized.match(englishPattern) ?? []),
    ...hindi.filter((word) => normalized.includes(word.normalize("NFC"))),
  ];
}
