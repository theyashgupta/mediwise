import { range } from "../range.js";
import type { Marker } from "../schema.js";
import { sources } from "../sources.js";

const { eclmUrinalysis2000, simerville2005 } = sources;

const urineSources = [simerville2005, eclmUrinalysis2000];

export const urineMarkers: Marker[] = [
  {
    key: "urine_ph",
    name: "Urine pH",
    aliases: ["ph urine", "urine reaction", "reaction urine", "urinary ph", "ph"],
    category: "urine",
    unit: "pH",
    conversions: [],
    precision: 1,
    description: "How acidic or alkaline your urine is.",
    whatItIs:
      "Urine pH measures acidity on a scale where 7 is neutral. Healthy urine is usually slightly acidic.",
    whyItMatters:
      "Persistently acidic urine favours uric acid stones. Persistently alkaline urine can signal a urine infection or favour other stones. A single value mostly reflects recent food.",
    whatMovesIt:
      "Meat and high-protein meals make urine more acidic. Vegetables, fruit, some infections and some medicines make it more alkaline.",
    ranges: [range(simerville2005, [5.0, 7.5], [4.5, 8.0])],
    sources: urineSources,
    core: false,
    direction: "both",
  },
  {
    key: "urine_specific_gravity",
    name: "Urine specific gravity",
    aliases: ["specific gravity", "sp gravity", "sp gr", "urine sg", "specific gravity urine"],
    category: "urine",
    unit: "ratio",
    conversions: [],
    precision: 3,
    description: "How concentrated your urine is.",
    whatItIs:
      "Specific gravity compares the density of urine with water. It shows how much the kidneys are concentrating or diluting urine.",
    whyItMatters:
      "A high value usually means you are under-hydrated. A value stuck near 1.010 regardless of fluid intake can mean the kidneys can no longer concentrate urine.",
    whatMovesIt:
      "Fluid intake changes it within hours. Sugar or protein in urine and contrast dye raise it.",
    ranges: [range(simerville2005, [1.005, 1.03], [1.002, 1.035])],
    sources: urineSources,
    core: false,
    direction: "both",
  },
  {
    key: "urine_protein",
    name: "Urine protein",
    aliases: [
      "protein urine",
      "urinary protein",
      "urine proteins",
      "proteins urine",
      "urine albumin qualitative",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Whether protein is leaking into your urine.",
    whatItIs:
      "The dipstick detects protein, mainly albumin, in urine and grades it from negative to 4+. Healthy kidneys allow almost no protein to pass.",
    whyItMatters:
      "Persistent protein in urine is a sign of kidney damage, often from diabetes or high blood pressure. A single trace can follow exercise or fever, so it needs a repeat or an ACR test.",
    whatMovesIt:
      "Kidney disease, high sugar and high blood pressure raise it. Fever, hard exercise, dehydration and urine infection raise it for a short time.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_glucose",
    name: "Urine glucose",
    aliases: [
      "glucose urine",
      "urine sugar",
      "sugar urine",
      "urinary glucose",
      "urine glucose qualitative",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Whether sugar is spilling into your urine.",
    whatItIs:
      "The dipstick detects glucose in urine. The kidneys normally reabsorb all of it until blood sugar passes about 180 mg/dL.",
    whyItMatters:
      "Sugar in urine usually means high blood sugar, so it is a reason to check HbA1c and fasting glucose. Some diabetes medicines cause it on purpose.",
    whatMovesIt:
      "High blood sugar and SGLT2 inhibitor medicines raise it. Pregnancy and some kidney conditions lower the threshold.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_ketones",
    name: "Urine ketones",
    aliases: [
      "ketone bodies",
      "ketones urine",
      "urine ketone",
      "ketone",
      "ketones",
      "urine acetone",
      "acetone",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Whether your body is burning fat for fuel instead of sugar.",
    whatItIs:
      "The body makes ketones when it burns fat for energy. The dipstick grades them in urine.",
    whyItMatters:
      "Ketones are normal after fasting or a low-carbohydrate diet. With high blood sugar they can signal a dangerous lack of insulin that needs urgent care.",
    whatMovesIt:
      "Fasting, low-carbohydrate diets, vomiting and hard exercise raise them. Uncontrolled diabetes raises them most.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_blood",
    name: "Urine blood",
    aliases: [
      "blood urine",
      "occult blood urine",
      "urine occult blood",
      "urine hemoglobin",
      "urine haemoglobin",
      "hemoglobin urine",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Whether traces of blood are in your urine.",
    whatItIs:
      "The dipstick detects hemoglobin from red cells in urine, even in amounts too small to see. Microscopy confirms whether red cells are present.",
    whyItMatters:
      "Blood in urine can come from infection, stones or, less often, kidney or bladder disease. Persistent blood without a clear cause needs a doctor's review.",
    whatMovesIt:
      "Periods, hard exercise, infection and kidney stones raise it. Muscle breakdown can give a positive dipstick without red cells.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_bilirubin",
    name: "Urine bilirubin",
    aliases: [
      "bilirubin urine",
      "urinary bilirubin",
      "bile pigment",
      "bile pigments",
      "urine bile pigments",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Whether processed bilirubin is spilling into your urine.",
    whatItIs:
      "The dipstick detects conjugated bilirubin, the form that the liver processed. Healthy urine does not contain it.",
    whyItMatters:
      "Bilirubin in urine suggests a liver or bile flow problem and is a reason to check liver markers. It can appear before skin turns yellow.",
    whatMovesIt:
      "Hepatitis, blocked bile ducts and some medicines raise it. Old samples left in light can test falsely negative.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_urobilinogen",
    name: "Urine urobilinogen",
    aliases: ["urobilinogen", "urobilinogen urine", "urinary urobilinogen"],
    category: "urine",
    unit: "mg/dL",
    conversions: [{ from: "EU/dL", factor: 1 }],
    precision: 1,
    description: "A bilirubin breakdown product that shows liver and red cell turnover.",
    whatItIs:
      "Gut bacteria make urobilinogen from bilirubin. The body absorbs a little and passes it in urine. Small amounts are normal.",
    whyItMatters:
      "A high value can signal liver strain or fast red cell breakdown. It adds context to the liver and blood count markers.",
    whatMovesIt:
      "Liver disease and red cell breakdown raise it. Antibiotics and complete bile duct blockage lower it.",
    ranges: [range(simerville2005, [null, 1.0], [null, 2.0])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_nitrite",
    name: "Urine nitrite",
    aliases: ["nitrite", "nitrites", "nitrite urine", "urinary nitrite"],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "A chemical sign of bacteria in your urine.",
    whatItIs:
      "Many bacteria that cause urine infections turn nitrate into nitrite. The dipstick detects that nitrite.",
    whyItMatters:
      "A positive nitrite strongly suggests a urine infection, especially with symptoms. A negative value does not exclude one, because some bacteria do not make nitrite.",
    whatMovesIt:
      "Urine infections raise it. Frequent urination, vitamin C and a low-vegetable diet can make it falsely negative.",
    ranges: [range(simerville2005, [null, 0], [null, 0])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_leukocyte_esterase",
    name: "Urine leukocyte esterase",
    aliases: [
      "leukocyte esterase",
      "leucocyte esterase",
      "urine leucocytes",
      "urine leukocytes",
      "leukocytes urine",
      "leucocytes urine",
    ],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "A dipstick sign of white cells in your urine.",
    whatItIs:
      "Leukocyte esterase is an enzyme that white cells release. The dipstick uses it to detect white cells in urine.",
    whyItMatters:
      "A positive result suggests inflammation in the urinary tract, most often an infection. Doctors read it with nitrite and the pus cell count.",
    whatMovesIt:
      "Urine infections, kidney stones and vaginal contamination of the sample raise it. A clean-catch sample reduces false positives.",
    ranges: [range(simerville2005, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_pus_cells",
    name: "Urine pus cells",
    aliases: [
      "pus cells",
      "pus cells urine",
      "urine wbc",
      "wbc urine",
      "white blood cells urine",
      "urine white cells",
      "w b c",
      "w b c pus cells",
    ],
    category: "urine",
    unit: "/hpf",
    conversions: [],
    precision: 0,
    description: "White cells seen in your urine under the microscope.",
    whatItIs:
      "Pus cells are white blood cells. The lab counts them per high-power microscope field in spun urine. A few are normal.",
    whyItMatters:
      "More than about five per field suggests inflammation or infection in the urinary tract. Contamination from the genital area can raise the count, especially in women.",
    whatMovesIt:
      "Urine infections, stones and contaminated samples raise it. A midstream clean-catch sample gives the truest count.",
    ranges: [range(simerville2005, [null, 5], [null, 10])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_rbc",
    name: "Urine red cells",
    aliases: [
      "rbc urine",
      "urine rbc",
      "red blood cells urine",
      "urine red blood cells",
      "red cells urine",
      "erythrocytes urine",
    ],
    category: "urine",
    unit: "/hpf",
    conversions: [],
    precision: 0,
    description: "Red cells seen in your urine under the microscope.",
    whatItIs:
      "This counts red blood cells per high-power microscope field in spun urine. Healthy urine has very few.",
    whyItMatters:
      "Three or more per field on repeat samples is microscopic hematuria and needs a doctor's review. A single raised count is often from exercise or periods.",
    whatMovesIt:
      "Periods, hard exercise, infection and kidney stones raise it. Testing again outside a period clarifies most results.",
    ranges: [range(simerville2005, [null, 2], [null, 5])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_epithelial_cells",
    name: "Urine epithelial cells",
    aliases: [
      "epithelial cells",
      "epithelial cells urine",
      "urine epithelial cells",
      "squamous epithelial cells",
      "epi cells",
    ],
    category: "urine",
    unit: "/hpf",
    conversions: [],
    precision: 0,
    description: "Lining cells in urine, mostly a sign of sample quality.",
    whatItIs:
      "The lining of the urinary tract and genital skin sheds epithelial cells. Most seen in routine urine are squamous cells from the skin.",
    whyItMatters:
      "Many squamous cells mean the sample contains skin contamination, which makes other values less reliable. Other cell types are less common, and the lab reads them.",
    whatMovesIt: "Collection technique moves it most. A midstream clean-catch sample lowers it.",
    ranges: [range(eclmUrinalysis2000, [null, 5], [null, 15])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_casts",
    name: "Urine casts",
    aliases: ["casts", "cast", "urine casts", "casts urine", "urinary casts"],
    category: "urine",
    unit: "/lpf",
    conversions: [],
    precision: 0,
    description: "Tube-shaped particles formed inside the kidneys.",
    whatItIs:
      "Casts are moulds of the kidney's tiny tubules, made of protein and sometimes cells. The lab counts them per low-power microscope field.",
    whyItMatters:
      "A few clear hyaline casts can appear after exercise or dehydration. Casts containing cells or granules suggest kidney inflammation and need review.",
    whatMovesIt:
      "Dehydration and hard exercise raise hyaline casts. Kidney disease raises the cellular and granular types.",
    ranges: [range(simerville2005, [null, 0], [null, 2])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_bacteria",
    name: "Urine bacteria",
    aliases: ["bacteria", "bacteria urine", "urinary bacteria", "bacteriuria"],
    category: "urine",
    unit: "grade",
    conversions: [],
    precision: 0,
    description: "Bacteria seen in your urine under the microscope.",
    whatItIs:
      "The lab checks spun urine for bacteria under the microscope and grades how many it sees. Fresh urine from a healthy bladder has few or none.",
    whyItMatters:
      "Bacteria with pus cells and symptoms suggest a urine infection, which a culture confirms. Bacteria alone often come from contamination or a sample that sat too long.",
    whatMovesIt:
      "Urine infections and delays before testing raise it. A clean-catch sample tested quickly gives the truest result.",
    ranges: [range(eclmUrinalysis2000, [null, 0], [null, 1])],
    sources: urineSources,
    core: false,
    direction: "high_is_bad",
  },
  {
    key: "urine_colour",
    name: "Urine colour",
    aliases: ["urine color", "colour urine", "color urine", "colour of urine", "color of urine"],
    category: "urine",
    unit: "text",
    conversions: [],
    precision: 0,
    description: "The colour of your urine, a rough sign of how much water you drink.",
    whatItIs: "The lab notes the colour of the urine sample. Normal urine is pale yellow to amber.",
    whyItMatters:
      "Dark yellow urine usually means you need to drink more water. Red, brown or very dark urine can be a sign of blood or bilirubin. The dipstick values show which.",
    whatMovesIt:
      "Water intake changes it most. Beetroot, some medicines and B vitamins also change the colour.",
    ranges: [],
    sources: urineSources,
    core: false,
    direction: "both",
  },
  {
    key: "urine_crystals",
    name: "Urine crystals",
    aliases: ["crystals", "crystals urine", "urinary crystals", "urine crystal"],
    category: "urine",
    unit: "text",
    conversions: [],
    precision: 0,
    description: "Mineral crystals seen in your urine under the microscope.",
    whatItIs:
      "The lab checks spun urine for crystals under the microscope. Common types are calcium oxalate, uric acid and phosphate.",
    whyItMatters:
      "A few common crystals are usually harmless and often form after the sample cools. Many crystals, or rare types, can show a higher risk of kidney stones.",
    whatMovesIt:
      "Low water intake and food high in oxalate or protein increase them. An old or concentrated sample can also show crystals.",
    ranges: [],
    sources: urineSources,
    core: false,
    direction: "both",
  },
];
