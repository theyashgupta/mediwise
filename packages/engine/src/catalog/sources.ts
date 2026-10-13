import type { Source } from "./schema.js";

export const sources = {
  ada2025: {
    id: "ada2025",
    title:
      "Standards of Care in Diabetes 2025. American Diabetes Association, Diabetes Care 48 (Suppl 1)",
    year: 2025,
    url: "https://diabetesjournals.org/care/issue/48/Supplement_1",
  },
  icmrDiabetes2018: {
    id: "icmrDiabetes2018",
    title: "ICMR Guidelines for Management of Type 2 Diabetes. Indian Council of Medical Research",
    year: 2018,
    url: "https://www.icmr.gov.in/icmrobject/custom_data/pdf/resource-guidelines/ICMR_GuidelinesType2diabetes2018_0.pdf",
  },
  icmrIndiab2023: {
    id: "icmrIndiab2023",
    title:
      "Metabolic non-communicable disease health report of India: the ICMR-INDIAB national cross-sectional study (ICMR-INDIAB-17). Anjana RM et al., Lancet Diabetes Endocrinol",
    year: 2023,
    url: "https://doi.org/10.1016/S2213-8587(23)00119-5",
  },
  lai2023: {
    id: "lai2023",
    title:
      "Lipid Association of India 2023 update on cardiovascular risk assessment and lipid management in Indian patients: Consensus Statement IV. Puri R et al., J Clin Lipidol",
    year: 2024,
    url: "https://doi.org/10.1016/j.jacl.2024.01.006",
  },
  ncepAtp3: {
    id: "ncepAtp3",
    title:
      "Third Report of the National Cholesterol Education Program Expert Panel on Detection, Evaluation, and Treatment of High Blood Cholesterol in Adults (ATP III) Final Report. Circulation",
    year: 2002,
    url: "https://doi.org/10.1161/circ.106.25.3143",
  },
  ahaAcc2018: {
    id: "ahaAcc2018",
    title:
      "2018 AHA/ACC Guideline on the Management of Blood Cholesterol. Grundy SM et al., Circulation",
    year: 2019,
    url: "https://doi.org/10.1161/CIR.0000000000000625",
  },
  escEas2019: {
    id: "escEas2019",
    title:
      "2019 ESC/EAS Guidelines for the management of dyslipidaemias. Mach F et al., Eur Heart J",
    year: 2020,
    url: "https://doi.org/10.1093/eurheartj/ehz455",
  },
  easLpa2022: {
    id: "easLpa2022",
    title:
      "Lipoprotein(a) in atherosclerotic cardiovascular disease and aortic stenosis: a European Atherosclerosis Society consensus statement. Kronenberg F et al., Eur Heart J",
    year: 2022,
    url: "https://doi.org/10.1093/eurheartj/ehac361",
  },
  ahaCdc2003: {
    id: "ahaCdc2003",
    title:
      "Markers of inflammation and cardiovascular disease: AHA/CDC scientific statement. Pearson TA et al., Circulation",
    year: 2003,
    url: "https://doi.org/10.1161/01.CIR.0000052939.59093.45",
  },
  kdigo2024: {
    id: "kdigo2024",
    title:
      "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int 105 (4S)",
    year: 2024,
    url: "https://doi.org/10.1016/j.kint.2023.10.018",
  },
  ckdEpi2021: {
    id: "ckdEpi2021",
    title:
      "New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. Inker LA et al., N Engl J Med",
    year: 2021,
    url: "https://doi.org/10.1056/NEJMoa2102953",
  },
  acg2017: {
    id: "acg2017",
    title:
      "ACG Clinical Guideline: Evaluation of Abnormal Liver Chemistries. Kwo PY et al., Am J Gastroenterol",
    year: 2017,
    url: "https://doi.org/10.1038/ajg.2016.517",
  },
  ata2014: {
    id: "ata2014",
    title:
      "Guidelines for the Treatment of Hypothyroidism: American Thyroid Association Task Force on Thyroid Hormone Replacement. Jonklaas J et al., Thyroid",
    year: 2014,
    url: "https://doi.org/10.1089/thy.2014.0028",
  },
  ataAace2012: {
    id: "ataAace2012",
    title:
      "Clinical Practice Guidelines for Hypothyroidism in Adults, cosponsored by the AACE and the ATA. Garber JR et al., Thyroid",
    year: 2012,
    url: "https://doi.org/10.1089/thy.2012.0205",
  },
  indiaThyroid2013: {
    id: "indiaThyroid2013",
    title:
      "Prevalence of hypothyroidism in adults: An epidemiological study in eight cities of India. Unnikrishnan AG et al., Indian J Endocrinol Metab",
    year: 2013,
    url: "https://doi.org/10.4103/2230-8210.113755",
  },
  endoVitD2011: {
    id: "endoVitD2011",
    title:
      "Evaluation, Treatment, and Prevention of Vitamin D Deficiency: An Endocrine Society Clinical Practice Guideline. Holick MF et al., J Clin Endocrinol Metab",
    year: 2011,
    url: "https://doi.org/10.1210/jc.2011-0385",
  },
  endoVitD2024: {
    id: "endoVitD2024",
    title:
      "Vitamin D for the Prevention of Disease: An Endocrine Society Clinical Practice Guideline. Demay MB et al., J Clin Endocrinol Metab",
    year: 2024,
    url: "https://doi.org/10.1210/clinem/dgae290",
  },
  iomVitD2011: {
    id: "iomVitD2011",
    title:
      "Dietary Reference Intakes for Calcium and Vitamin D. Institute of Medicine, National Academies Press",
    year: 2011,
    url: "https://doi.org/10.17226/13050",
  },
  whoAnaemia2024: {
    id: "whoAnaemia2024",
    title:
      "Guideline on haemoglobin cutoffs to define anaemia in individuals and populations. World Health Organization",
    year: 2024,
    url: "https://www.who.int/publications/i/item/9789240088542",
  },
  whoFerritin2020: {
    id: "whoFerritin2020",
    title:
      "Guideline on use of ferritin concentrations to assess iron status in individuals and populations. World Health Organization",
    year: 2020,
    url: "https://www.who.int/publications/i/item/9789240000124",
  },
  who2016Myeloid: {
    id: "who2016Myeloid",
    title:
      "The 2016 revision to the World Health Organization classification of myeloid neoplasms and acute leukemia. Arber DA et al., Blood",
    year: 2016,
    url: "https://doi.org/10.1182/blood-2016-03-643544",
  },
  nfhs5: {
    id: "nfhs5",
    title:
      "National Family Health Survey (NFHS-5), 2019-21: India Report. International Institute for Population Sciences and ICF",
    year: 2021,
    url: "https://dhsprogram.com/pubs/pdf/FR375/FR375.pdf",
  },
  camaschella2015: {
    id: "camaschella2015",
    title: "Iron-Deficiency Anemia. Camaschella C, N Engl J Med",
    year: 2015,
    url: "https://doi.org/10.1056/NEJMra1401038",
  },
  aga2020: {
    id: "aga2020",
    title:
      "AGA Clinical Practice Guidelines on the Gastrointestinal Evaluation of Iron Deficiency Anemia. Ko CW et al., Gastroenterology",
    year: 2020,
    url: "https://doi.org/10.1053/j.gastro.2020.06.046",
  },
  bsh2014: {
    id: "bsh2014",
    title:
      "Guidelines for the diagnosis and treatment of cobalamin and folate disorders. Devalia V et al., British Committee for Standards in Haematology, Br J Haematol",
    year: 2014,
    url: "https://doi.org/10.1111/bjh.12959",
  },
  whoFolate2015: {
    id: "whoFolate2015",
    title:
      "Serum and red blood cell folate concentrations for assessing folate status in populations. WHO Vitamin and Mineral Nutrition Information System",
    year: 2015,
    url: "https://www.who.int/publications/i/item/WHO-NMH-NHD-EPG-15.01",
  },
  yajnik2006: {
    id: "yajnik2006",
    title:
      "Vitamin B12 deficiency and hyperhomocysteinemia in rural and urban Indians. Yajnik CS et al., J Assoc Physicians India",
    year: 2006,
    url: "https://pubmed.ncbi.nlm.nih.gov/17214273/",
  },
  refsum2004: {
    id: "refsum2004",
    title:
      "Facts and recommendations about total homocysteine determinations: an expert opinion. Refsum H et al., Clin Chem",
    year: 2004,
    url: "https://doi.org/10.1373/clinchem.2003.021634",
  },
  acrGout2020: {
    id: "acrGout2020",
    title:
      "2020 American College of Rheumatology Guideline for the Management of Gout. FitzGerald JD et al., Arthritis Care Res",
    year: 2020,
    url: "https://doi.org/10.1002/acr.24180",
  },
  eularGout2016: {
    id: "eularGout2016",
    title:
      "2016 updated EULAR evidence-based recommendations for the management of gout. Richette P et al., Ann Rheum Dis",
    year: 2017,
    url: "https://doi.org/10.1136/annrheumdis-2016-209707",
  },
  endoTestosterone2018: {
    id: "endoTestosterone2018",
    title:
      "Testosterone Therapy in Men With Hypogonadism: An Endocrine Society Clinical Practice Guideline. Bhasin S et al., J Clin Endocrinol Metab",
    year: 2018,
    url: "https://doi.org/10.1210/jc.2018-00229",
  },
  travison2017: {
    id: "travison2017",
    title:
      "Harmonized Reference Ranges for Circulating Testosterone Levels in Men of Four Cohort Studies in the United States and Europe. Travison TG et al., J Clin Endocrinol Metab",
    year: 2017,
    url: "https://doi.org/10.1210/jc.2016-2935",
  },
  endoAdrenal2016: {
    id: "endoAdrenal2016",
    title:
      "Diagnosis and Treatment of Primary Adrenal Insufficiency: An Endocrine Society Clinical Practice Guideline. Bornstein SR et al., J Clin Endocrinol Metab",
    year: 2016,
    url: "https://doi.org/10.1210/jc.2015-1710",
  },
  endoProlactin2011: {
    id: "endoProlactin2011",
    title:
      "Diagnosis and Treatment of Hyperprolactinemia: An Endocrine Society Clinical Practice Guideline. Melmed S et al., J Clin Endocrinol Metab",
    year: 2011,
    url: "https://doi.org/10.1210/jc.2010-1692",
  },
  matthews1985: {
    id: "matthews1985",
    title:
      "Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man. Matthews DR et al., Diabetologia",
    year: 1985,
    url: "https://doi.org/10.1007/BF00280883",
  },
  misra2009: {
    id: "misra2009",
    title:
      "Consensus statement for diagnosis of obesity, abdominal obesity and the metabolic syndrome for Asian Indians. Misra A et al., J Assoc Physicians India",
    year: 2009,
    url: "https://pubmed.ncbi.nlm.nih.gov/19582986/",
  },
  tietz2022: {
    id: "tietz2022",
    title: "Tietz Textbook of Laboratory Medicine, 7th edition. Rifai N (ed.), Elsevier",
    year: 2022,
  },
  dacie2017: {
    id: "dacie2017",
    title:
      "Dacie and Lewis Practical Haematology, 12th edition. Bain BJ, Bates I, Laffan MA (eds.), Elsevier",
    year: 2017,
  },
  simerville2005: {
    id: "simerville2005",
    title: "Urinalysis: A Comprehensive Review. Simerville JA et al., Am Fam Physician",
    year: 2005,
    url: "https://www.aafp.org/pubs/afp/issues/2005/0315/p1153.html",
  },
  eclmUrinalysis2000: {
    id: "eclmUrinalysis2000",
    title:
      "European Urinalysis Guidelines. Kouri T et al., European Confederation of Laboratory Medicine, Scand J Clin Lab Invest 60 (Suppl 231)",
    year: 2000,
    url: "https://doi.org/10.1080/00365513.2000.12056993",
  },
  escHf2021: {
    id: "escHf2021",
    title:
      "2021 ESC Guidelines for the diagnosis and treatment of acute and chronic heart failure. McDonagh TA et al., Eur Heart J",
    year: 2021,
    url: "https://doi.org/10.1093/eurheartj/ehab368",
  },
  izincg2012: {
    id: "izincg2012",
    title:
      "Assessing population zinc status with serum zinc concentration. International Zinc Nutrition Consultative Group, Technical Brief No. 2",
    year: 2012,
    url: "https://www.izincg.org/s/IZiNCG_TechBrief2_2012-3_English.pdf",
  },
  whoRetinol2011: {
    id: "whoRetinol2011",
    title:
      "Serum retinol concentrations for determining the prevalence of vitamin A deficiency in populations. WHO Vitamin and Mineral Nutrition Information System",
    year: 2011,
    url: "https://www.who.int/publications/i/item/WHO-NMH-NHD-MNM-11.3",
  },
  iomAntioxidants2000: {
    id: "iomAntioxidants2000",
    title:
      "Dietary Reference Intakes for Vitamin C, Vitamin E, Selenium, and Carotenoids. Institute of Medicine, National Academies Press",
    year: 2000,
    url: "https://doi.org/10.17226/9810",
  },
  iomBVitamins1998: {
    id: "iomBVitamins1998",
    title:
      "Dietary Reference Intakes for Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic Acid, Biotin, and Choline. Institute of Medicine, National Academies Press",
    year: 1998,
    url: "https://doi.org/10.17226/6015",
  },
  catalona1991: {
    id: "catalona1991",
    title:
      "Measurement of prostate-specific antigen in serum as a screening test for prostate cancer. Catalona WJ et al., N Engl J Med",
    year: 1991,
    url: "https://doi.org/10.1056/NEJM199104253241702",
  },
  atlanta2012: {
    id: "atlanta2012",
    title:
      "Classification of acute pancreatitis 2012: revision of the Atlanta classification and definitions by international consensus. Banks PA et al., Gut",
    year: 2013,
    url: "https://doi.org/10.1136/gutjnl-2012-302779",
  },
  millan2009: {
    id: "millan2009",
    title:
      "Lipoprotein ratios: Physiological significance and clinical usefulness in cardiovascular prevention. Millan J et al., Vasc Health Risk Manag",
    year: 2009,
    url: "https://doi.org/10.2147/VHRM.S6269",
  },
  walldius2006: {
    id: "walldius2006",
    title:
      "The apoB/apoA-I ratio: a strong, new risk factor for cardiovascular disease and a target for lipid-lowering therapy. Walldius G, Jungner I, J Intern Med",
    year: 2006,
    url: "https://doi.org/10.1111/j.1365-2796.2006.01643.x",
  },
  mclaughlin2003: {
    id: "mclaughlin2003",
    title:
      "Use of metabolic markers to identify overweight individuals who are insulin resistant. McLaughlin T et al., Ann Intern Med",
    year: 2003,
    url: "https://doi.org/10.7326/0003-4819-139-10-200311180-00007",
  },
  endukuru2020: {
    id: "endukuru2020",
    title:
      "Cut-off Values and Clinical Utility of Surrogate Markers for Insulin Resistance and Beta-Cell Function to Identify Metabolic Syndrome and Its Components among Southern Indian Adults. Endukuru CK et al., J Obes Metab Syndr",
    year: 2020,
    url: "https://doi.org/10.7570/jomes20071",
  },
  gayosoDiz2013: {
    id: "gayosoDiz2013",
    title:
      "Insulin resistance (HOMA-IR) cut-off values and the metabolic syndrome in a general adult population: effect of gender and age: EPIRCE cross-sectional study. Gayoso-Diz P et al., BMC Endocr Disord",
    year: 2013,
    url: "https://doi.org/10.1186/1472-6823-13-47",
  },
  whoHepTesting2017: {
    id: "whoHepTesting2017",
    title: "WHO Guidelines on Hepatitis B and C Testing. World Health Organization",
    year: 2017,
    url: "https://www.who.int/publications/i/item/9789241549981",
  },
  acipHepB2018: {
    id: "acipHepB2018",
    title:
      "Prevention of Hepatitis B Virus Infection in the United States: Recommendations of the Advisory Committee on Immunization Practices. Schillie S et al., MMWR Recomm Rep 67(1)",
    year: 2018,
    url: "https://doi.org/10.15585/mmwr.rr6701a1",
  },
  bain2005: {
    id: "bain2005",
    title: "Diagnosis from the Blood Smear. Bain BJ, N Engl J Med 353",
    year: 2005,
    url: "https://doi.org/10.1056/NEJMra043442",
  },
  weiss2005: {
    id: "weiss2005",
    title: "Anemia of Chronic Disease. Weiss G, Goodnough LT, N Engl J Med",
    year: 2005,
    url: "https://doi.org/10.1056/NEJMra041809",
  },
  ata2016: {
    id: "ata2016",
    title:
      "2016 American Thyroid Association Guidelines for Diagnosis and Management of Hyperthyroidism and Other Causes of Thyrotoxicosis. Ross DS et al., Thyroid",
    year: 2016,
    url: "https://doi.org/10.1089/thy.2016.0229",
  },
  aasld2018: {
    id: "aasld2018",
    title:
      "The diagnosis and management of nonalcoholic fatty liver disease: Practice guidance from the American Association for the Study of Liver Diseases. Chalasani N et al., Hepatology",
    year: 2018,
    url: "https://doi.org/10.1002/hep.29367",
  },
  who2000: {
    id: "who2000",
    title:
      "Obesity: preventing and managing the global epidemic. Report of a WHO consultation. WHO Technical Report Series 894",
    year: 2000,
    url: "https://iris.who.int/handle/10665/42330",
  },
  whoAsia2004: {
    id: "whoAsia2004",
    title:
      "Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. WHO Expert Consultation, Lancet",
    year: 2004,
    url: "https://doi.org/10.1016/S0140-6736(03)15268-3",
  },
  accAha2017: {
    id: "accAha2017",
    title:
      "2017 ACC/AHA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. Whelton PK et al., Hypertension",
    year: 2018,
    url: "https://doi.org/10.1161/HYP.0000000000000065",
  },
  ahaHeartRate: {
    id: "ahaHeartRate",
    title: "All About Heart Rate (Pulse). American Heart Association",
    year: 2024,
    url: "https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse",
  },
  rautaharju2009: {
    id: "rautaharju2009",
    title:
      "AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the Electrocardiogram, Part IV: The ST Segment, T and U Waves, and the QT Interval. Rautaharju PM et al., Circulation",
    year: 2009,
    url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191096",
  },
  drew2010: {
    id: "drew2010",
    title:
      "Prevention of Torsade de Pointes in Hospital Settings: A Scientific Statement From the American Heart Association and the American College of Cardiology Foundation. Drew BJ et al., Circulation",
    year: 2010,
    url: "https://doi.org/10.1161/CIRCULATIONAHA.109.192704",
  },
  hancock2009: {
    id: "hancock2009",
    title:
      "AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the Electrocardiogram, Part V: Electrocardiogram Changes Associated With Cardiac Chamber Hypertrophy. Hancock EW et al., Circulation",
    year: 2009,
    url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191097",
  },
  kratzer2003: {
    id: "kratzer2003",
    title:
      "Factors affecting liver size: a sonographic survey of 2080 subjects. Kratzer W et al., J Ultrasound Med",
    year: 2003,
    url: "https://doi.org/10.7863/jum.2003.22.11.1155",
  },
  chow2016: {
    id: "chow2016",
    title:
      "Spleen Size Is Significantly Influenced by Body Height and Sex: Establishment of Normal Values for Spleen Size at US with a Cohort of 1200 Healthy Individuals. Chow KU et al., Radiology",
    year: 2016,
    url: "https://doi.org/10.1148/radiol.2015150887",
  },
  emamian1993: {
    id: "emamian1993",
    title:
      "Kidney dimensions at sonography: correlation with age, sex, and habitus in 665 adult volunteers. Emamian SA et al., AJR Am J Roentgenol",
    year: 1993,
    url: "https://doi.org/10.2214/ajr.160.1.8416654",
  },
  surawicz2009: {
    id: "surawicz2009",
    title:
      "AHA/ACCF/HRS Recommendations for the Standardization and Interpretation of the Electrocardiogram, Part III: Intraventricular Conduction Disturbances. Surawicz B et al., Circulation",
    year: 2009,
    url: "https://doi.org/10.1161/CIRCULATIONAHA.108.191095",
  },
  kusumoto2019: {
    id: "kusumoto2019",
    title:
      "2018 ACC/AHA/HRS Guideline on the Evaluation and Management of Patients With Bradycardia and Cardiac Conduction Delay. Kusumoto FM et al., Circulation",
    year: 2019,
    url: "https://doi.org/10.1161/CIR.0000000000000628",
  },
  weinreb1982: {
    id: "weinreb1982",
    title:
      "Portal vein measurements by real-time sonography. Weinreb J et al., AJR Am J Roentgenol",
    year: 1982,
    url: "https://doi.org/10.2214/ajr.139.3.497",
  },
  bowie2000: {
    id: "bowie2000",
    title:
      "What is the upper limit of normal for the common bile duct on ultrasound: how much do you want it to be? Bowie JD, Am J Gastroenterol",
    year: 2000,
    url: "https://doi.org/10.1111/j.1572-0241.2000.01925.x",
  },
  bankier2024: {
    id: "bankier2024",
    title:
      "Fleischner Society: Glossary of Terms for Thoracic Imaging. Bankier AA et al., Radiology",
    year: 2024,
    url: "https://doi.org/10.1148/radiol.232558",
  },
  andreotti2020: {
    id: "andreotti2020",
    title:
      "O-RADS US Risk Stratification and Management System: A Consensus Guideline from the ACR Ovarian-Adnexal Reporting and Data System Committee. Andreotti RF et al., Radiology",
    year: 2020,
    url: "https://doi.org/10.1148/radiol.2019191150",
  },
  nayar2015: {
    id: "nayar2015",
    title:
      "The Bethesda System for Reporting Cervical Cytology: Definitions, Criteria, and Explanatory Notes, 3rd edition. Nayar R, Wilbur DC (eds), Springer",
    year: 2015,
    url: "https://doi.org/10.1007/978-3-319-11074-5",
  },
  roberts2023: {
    id: "roberts2023",
    title: "British Thoracic Society Guideline for pleural disease. Roberts ME et al., Thorax",
    year: 2023,
    url: "https://doi.org/10.1136/thorax-2022-219784",
  },
  joglar2023: {
    id: "joglar2023",
    title:
      "2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation. Joglar JA et al., Circulation",
    year: 2023,
    url: "https://doi.org/10.1161/CIR.0000000000001193",
  },
  aasld2023: {
    id: "aasld2023",
    title:
      "AASLD Practice Guidance on the clinical assessment and management of nonalcoholic fatty liver disease. Rinella ME et al., Hepatology",
    year: 2023,
    url: "https://doi.org/10.1097/HEP.0000000000000323",
  },
  masld2023: {
    id: "masld2023",
    title:
      "A multisociety Delphi consensus statement on new fatty liver disease nomenclature. Rinella ME et al., J Hepatol",
    year: 2023,
    url: "https://doi.org/10.1016/j.jhep.2023.06.003",
  },
  eauUrolithiasis2024: {
    id: "eauUrolithiasis2024",
    title: "EAU Guidelines on Urolithiasis. Skolarikos A et al., European Association of Urology",
    year: 2024,
    url: "https://uroweb.org/guidelines/urolithiasis",
  },
  aafpAda2018: {
    id: "aafpAda2018",
    title:
      "Diabetes: ADA Releases Revised Position Statement on Standards of Medical Care. Hauk L, Am Fam Physician 98 (3)",
    year: 2018,
    url: "https://www.aafp.org/pubs/afp/issues/2018/0801/p187.html",
  },
  usPharmacistAda2022: {
    id: "usPharmacistAda2022",
    title:
      "Recommended Glycemic Targets and Value of Routine Monitoring, on the ADA Standards of Medical Care in Diabetes 2022. US Pharmacist",
    year: 2022,
    url: "https://www.uspharmacist.com/article/recommended-glycemic-targets-and-value-of-routine-monitoring",
  },
  clevelandDkd2026: {
    id: "clevelandDkd2026",
    title:
      "Diabetes and Chronic Kidney Disease Management: A Practical Primary Care Approach. Cleveland Clinic Consult QD",
    year: 2026,
    url: "https://consultqd.clevelandclinic.org/diabetes-and-chronic-kidney-disease-management-a-practical-primary-care-approach",
  },
} satisfies Record<string, Source>;
