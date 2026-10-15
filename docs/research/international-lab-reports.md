# International lab reports: what the parser and the copy must handle

Research date: 2026-10-15. Verified items are marked. Everything else is background knowledge and needs a real fixture before the engine relies on it.

## Summary

- Units are the biggest parser risk. The US prints conventional units (mg/dL, g/dL, ng/mL). The UK, most of the EU, Australia, New Zealand and Canada print SI (mmol/L, umol/L, g/L). France, Germany, the Gulf, Latin America and Southeast Asia mix the two. Parse the unit string per row. Never infer the unit from the country.
- HbA1c comes in three forms: NGSP percent only (US, India, Canada, Latin America), IFCC mmol/mol only (UK, Netherlands, some EU), both (Australia, New Zealand). Formula: IFCC mmol/mol = 10.93 x NGSP% - 23.5 (verified, NGSP).
- BUN and urea are different analytes. US reports BUN in mg/dL (x0.357 to mmol/L). UK, EU, AU, NZ report urea in mmol/L (urea mg/dL x0.1665 to mmol/L). Keep both as separate markers.
- Decimal commas (DE, FR, NL, ES, IT, PL, Brazil, Quebec) and day-first dates (DD/MM/YYYY, DD.MM.YYYY) are the main extraction traps. US prints MM/DD/YYYY. Resolve ambiguous dates from document clues (language, unit system, lab), never from the account country.
- Flags: Quest appends H or L to the result cell ("115 H", verified). Epic MyChart shows a red H, blue L or "Critical" in a narrow column. Others use asterisks, arrows, bold, "A" for abnormal, "+" and "-".
- eGFR: US uses CKD-EPI 2021 race-free. UK uses CKD-EPI 2009 with no ethnicity coefficient (verified, NICE NG203 and UKKA 2023). Some EU labs still print MDRD or Cockcroft-Gault. Store the equation name when printed.
- Copy: "Ask your doctor" works everywhere. "GP" fits UK, AU, NZ, IE only. "Provider" or "physician" fits the US. "Family doctor" fits Canada. "Lab results" works in UK and US. "Haemoglobin" is UK/AU spelling, "hemoglobin" US/CA.

## Layouts by region

### United States (verified on a Quest sample PDF)
- Header strip of three boxes: Patient Information (name as LAST, FIRST, DOB MM/DD/YYYY, age, gender, fasting Y/N, patient ID), Specimen Information (specimen ID, requisition, Collected / Received / Reported with times and a time zone), Client Information (ordering practice).
- "Report Status: Final" top right. Footer with specimen ID and "PAGE 1 OF 3".
- Table columns: Test Name, Result, Reference Range/Comments. Flag appended to the result in the same cell ("115 H"). No separate flag column.
- The reference range includes the unit: "65-99 mg/dL", "<5.7 % of total Hgb", "> OR = 46 mg/dL" (OR = means >= or <=). Calculated values carry "(calc)". A range cell may be a bare unit with no range.
- "See Note N" references, notes in monospace at the bottom.
- Labcorp (unverified): separate flag column, tests grouped by panel, columns result, flag, units, reference interval.
- Epic MyChart screenshots (vendor description, unverified): test name, result, range in small text under the value, flag column, unit, date. Gotchas: flag merged into the value, cropped range, text results ("No growth", "Reactive", "See comment"), one panel per screen.
- Patient downloads: MyQuest and Labcorp Patient give PDFs. MyChart gives screens.

### United Kingdom
- NHS App (verified from the NHS help page): results live under Health records, GP health record, Test results. Each result has a "Your result" section and a history graph when the test ran at least twice in three years with a reference range. Results cannot be downloaded, so users send phone screenshots. Some results are held until a clinician reviews them.
- Private labs: Medichecks gives a printable PDF with each result beside the normal range. Thriva compares against "normal or optimal" ranges. Optimal ranges are not lab reference intervals. Keep them separate.
- SI units. HbA1c in mmol/mol, often with percent beside it. Urea in mmol/L. Dates DD/MM/YYYY. Flags typically H and L or an asterisk (unverified).

### European Union (unverified, no sample found)
- Languages and headers: German (Befund, Referenzbereich, Frauen/Maenner), French (Resultats, Valeurs de reference, Anteriorites), Dutch (Uitslag, Referentiewaarde), Spanish (Resultado, Valores de referencia), Italian (Valori di riferimento), Polish (Wynik, Zakres referencyjny).
- Decimal comma. DD.MM.YYYY in Germany and Poland, DD/MM/YYYY in France, Spain and Italy.
- France often prints previous results in an "anteriorites" column. Spain and Italy often print a prior-result column.
- Germany: often conventional (mg/dL glucose and cholesterol, g/dL haemoglobin) with SI in brackets or on a second line. France: g/L for haemoglobin and proteins, sometimes both g/L and mmol/L for glucose and lipids, creatinine in mg/L or umol/L. Netherlands: SI, HbA1c in mmol/mol, haemoglobin sometimes in mmol/L.
- Flags vary: asterisks, H and L, + and -, bold, arrows.

### Australia and New Zealand
- HbA1c dual reported: percent with one decimal and mmol/mol with no decimals (verified, Diabetes Australia, MJA 2011). 6.5% equals 48 mmol/mol.
- SI units. Harmonised adult reference intervals for 12 common chemistry analytes (AACB and RCPA). RCPA SPIA guidelines define preferred units.
- Likely DD/MM/YYYY, flag in the result line, cumulative columns on some reports (unverified).

### Canada
- SI for glucose, lipids, creatinine (umol/L), calcium (mmol/L). HbA1c in percent (one British Columbia LifeLabs printout). Quebec reports are French, often bilingual. Dates YYYY-MM-DD or DD/MM/YYYY.

### Gulf
- One Dubai lab sample: English only, glucose in mg/dL, ADA ranges. Other UAE sources use mmol/L and mmol/mol, so labs mix.
- Bilingual reports: English body, Arabic headers and footers. Expect Western digits in the body, right-to-left header text, sometimes Hijri dates. A CC BY 4.0 dataset of 260 Egyptian bilingual reports exists on Mendeley (bygfmk4rx9) for fixtures.

### Southeast Asia and Latin America (unverified)
- Singapore and Malaysia mostly SI. Philippines often mg/dL, sometimes both. English, DD/MM/YYYY.
- Latin America: Spanish and Portuguese ("Valores de referencia", "Valores de referencia", "hemoglobina glicada"), conventional units, decimal comma in Brazil and much of the region, DD/MM/YYYY.

## Unit table (typical, unverified unless marked)

| Marker | US | UK | EU | AU/NZ | Canada |
|---|---|---|---|---|---|
| Glucose | mg/dL (verified) | mmol/L | DE mg/dL or both, FR g/L and mmol/L, NL mmol/L, ES/IT/PL mg/dL | mmol/L | mmol/L |
| HbA1c | % (verified) | mmol/mol | % or mmol/mol | mmol/mol and % (verified) | % |
| Cholesterol, LDL, HDL, triglycerides | mg/dL | mmol/L | DE mg/dL, FR g/L or mmol/L, NL mmol/L | mmol/L | mmol/L |
| Creatinine | mg/dL | umol/L | DE mg/dL, FR mg/L or umol/L, NL umol/L | umol/L | umol/L (verified) |
| Urea / BUN | BUN mg/dL | urea mmol/L | urea mmol/L or g/L, DE mg/dL | urea mmol/L | urea mmol/L |
| Uric acid | mg/dL | umol/L | DE mg/dL, NL umol/L | mmol/L | umol/L |
| Bilirubin | mg/dL | umol/L | DE mg/dL, FR mg/L or umol/L | umol/L | umol/L |
| Calcium | mg/dL | mmol/L | mmol/L, FR also mg/L | mmol/L | mmol/L (verified) |
| Haemoglobin | g/dL | g/L | DE g/dL, FR g/dL or g/L, NL mmol/L | g/L | g/L |
| TSH | mIU/L or uIU/mL (equal) | mIU/L | mIU/L or uIU/mL | mIU/L | mIU/L |
| Free T4 | ng/dL | pmol/L | either | pmol/L | pmol/L |
| Vitamin D 25-OH | ng/mL | nmol/L | either | nmol/L | nmol/L |
| Vitamin B12 | pg/mL | ng/L or pmol/L | pg/mL or pmol/L | pmol/L | pmol/L |
| Ferritin | ng/mL | ug/L | either | ug/L | ug/L |
| Iron | ug/dL | umol/L | either | umol/L | umol/L |
| ALT, AST | U/L | U/L | U/L, rarely ukat/L | U/L | U/L |

Gulf, Southeast Asia and Latin America: either system, often conventional.

## Conversion factors (verified, Labcorp SI table unless noted)

- Glucose mg/dL x0.0555 = mmol/L.
- Total, HDL and LDL cholesterol mg/dL x0.0259 = mmol/L.
- Triglycerides mg/dL x0.0113 = mmol/L.
- Creatinine mg/dL x88.4 = umol/L.
- BUN mg/dL x0.357 = mmol/L. Urea mg/dL x0.1665 = mmol/L.
- Uric acid mg/dL x0.059 = mmol/L (x59.5 = umol/L).
- Bilirubin mg/dL x17.1 = umol/L.
- Calcium mg/dL x0.25 = mmol/L.
- Iron ug/dL x0.179 = umol/L.
- Free T4 ng/dL x12.9 = pmol/L.
- Ferritin ng/mL = ug/L. TSH uIU/mL = mIU/L.
- Vitamin B12 pg/mL x0.738 = pmol/L.
- Vitamin D 25-OH ng/mL x2.5 = nmol/L (secondary sources, not the Labcorp 2.4 factor which is for calcitriol).
- HbA1c IFCC mmol/mol = 10.93 x NGSP% - 23.5 (NGSP).
- Haemoglobin g/dL x10 = g/L. Dutch mmol/L: g/dL x0.6206.

## Marker naming (unverified except Quest)

| Concept | US | UK | EU and other | India today |
|---|---|---|---|---|
| Haemoglobin | Hemoglobin, Hgb | Haemoglobin, Hb | Haemoglobin, Hemoglobine, Hemoglobina | Haemoglobin, Hb |
| Full blood count | CBC with or without Differential | FBC | Blutbild, NFS, Hemograma, Emocromo, Morfologia | CBC, Hemogram |
| Kidney panel | BMP, CMP, Renal function panel | U&E, eGFR | Retentionswerte, Ionogramme | KFT, RFT |
| Liver panel | Hepatic function panel | LFT | Leberwerte, Bilan hepatique | LFT |
| Lipids | Lipid panel | Lipid profile | Lipidprofil, Bilan lipidique | Lipid profile |
| Vitamin D | Vitamin D, 25-Hydroxy | Vitamin D (25-OH) | 25-OH-Vitamin D, Vitamine D 25-OH | Vitamin D total |
| TSH | TSH, TSH 3rd generation | TSH | TSH ultrasensible | TSH |
| ALT / AST | ALT, AST, older SGPT/SGOT | ALT, AST | GPT/GOT (DE), ALAT/ASAT (FR, NL), TGP/TGO (ES, IT, PT) | ALT (SGPT), AST (SGOT) |
| Glucose | Glucose, fasting | Glucose (fasting), plasma glucose | Glukose, Glycemie, Glucosa, Glicemia | Glucose Fasting |
| Urea | BUN, Urea Nitrogen | Urea | Harnstoff, Uree, Ureum | Urea, BUN |
| HbA1c | Hemoglobin A1c, A1c, "% of total Hgb" (verified) | HbA1c | HbA1c, Glykiertes Haemoglobin, Hemoglobine glyquee, hemoglobina glicada | HbA1c |

## Reference ranges, decimals, dates

- Labs print their own intervals. Keep the printed range per row. Never replace it with a national range. MyChart can show the current range against old results, so take the range from the row, not the page.
- Range notation: "<5.7", "> OR = 46" (Quest), "4.5 - 5.9", "4,5 - 5,9", ">= 60", "Female / Male" on separate lines.
- Decimal comma with "." or space as thousands separator: "1.234" is ambiguous. Use the analyte's plausible range to decide.
- Dates: US MM/DD/YYYY, UK/AU/NZ/IE DD/MM/YYYY, DE/PL DD.MM.YYYY, ISO YYYY-MM-DD in some Canadian labs. Quest prints times with a time-zone abbreviation.

## Engineering recommendations

1. Parse the unit string per row and store the value in the printed unit. Convert in a separate step with an analyte-specific table. Never convert when the unit is ambiguous.
2. Keep urea and BUN as distinct analytes. Treat HbA1c as one analyte with percent and mmol/mol units.
3. Store the eGFR equation name, the printed range, the flag and the lab comment as separate fields.
4. Normalise decimal commas before parsing. Use plausible ranges to reject thousands-separator misreads.
5. Resolve dates from a document-level locale guess (header language, lab brand, unit system). Ask the user when still ambiguous.
6. Build fixtures from made-up reports in each layout (Quest-style US, NHS-App-style UK screenshot, German decimal-comma, Dubai bilingual).

## Regulatory notes that touch copy

- The medical purpose a regulator reads comes from the manufacturer's own words: labelling, app store text and landing pages (MHRA, UK). "For information only" does not help when a claim elsewhere says the app diagnoses or decides treatment. Keep every claim as "explains, scores against the printed range, tracks" and "ask your doctor".
- US FDA 2022 CDS guidance covers clinician-facing software. Patient-facing tools that give a risk score or suggest a disease may count as a device. Avoid "risk score for diabetes" style claims.
- GDPR Article 9: health data needs explicit consent. HIPAA does not bind a direct-to-consumer app, but the FTC Health Breach Notification Rule does.
- Avoid the NHS name and logo and any claim of affiliation with a lab or health service.

## Public samples

- Quest Diabetes Risk Panel sample PDF (2014, verified): questdiagnostics.com/content/dam/corporate/unrestricted/documents/other/drpws_sample_report/DRPwS_sample_report.pdf
- Quest SI units document: questdiagnostics.com/dms/Documents/test-center/si_units.pdf
- Labcorp SI conversion table: labcorp.com/test-menu/resources/si-unit-conversion-table
- NHS App test results help: nhs.uk/nhs-app/help/health-records-in-the-nhs-app/test-results/
- Freiburg Medical Laboratory Dubai diabetes sample: fml-dubai.com/media/3619/fml-diabetes-profile-sample-report.pdf
- Mendeley Egyptian bilingual reports, CC BY 4.0: data.mendeley.com/datasets/bygfmk4rx9/2
- NGSP IFCC conversion: ngsp.org/ifccngsp.asp
- NICE NG203 and UKKA 2023 eGFR safety alert.
- Not found: official samples from Labcorp, Medichecks, Thriva, Randox, Synlab, Unilabs, Cerba, Sonic, LifeLabs, Dynacare, Al Borg. Fixtures for these must be made up from the descriptions above.
