# Marker catalog

Every marker MediWise understands, with ranges, copy, aliases and sources. The catalog is code, versioned with git. It has no I/O.

## Files

| File                    | Holds                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `schema.ts`             | zod schemas. Every type in the catalog comes from these.                                                                       |
| `sources.ts`            | Every cited document, keyed by id.                                                                                             |
| `markers/<category>.ts` | Measured markers, one file per category.                                                                                       |
| `derived.ts`            | Markers computed from other markers.                                                                                           |
| `studies.ts`            | `studyMarkers`: ECG and scan measurements copied from printed study reports. Not in `markers`, so lab mapping never sees them. |
| `advice.ts`             | `lifestyle` and `urgentLimits`: habit lines and doctor-now limits for suggestions.                                             |
| `compute-derived.ts`    | `computeDerived(derived, values, profile)`.                                                                                    |
| `find-marker.ts`        | `normalizeName` and the alias lookup.                                                                                          |
| `categories.ts`         | Category display labels and order.                                                                                             |
| `range.ts`              | `range()` helper. Sets `ageMin: 18` unless the call sets ages.                                                                 |
| `index.ts`              | Public API: `markers`, `derived`, `findMarker`, `coreMarkerKeys`, `categories`, `sources`, `computeDerived`, the schemas.      |

## Ranges

- A value inside `optimal` is optimal. A value outside `optimal` and inside `watch` is watch. A value outside `watch` is risk.
- Intervals are closed. `null` means that side is open.
- A range applies when `ageMin <= age < ageMax`. A missing `sex`, `ageMin`, `ageMax` or `ancestry` matches every profile.
- Most ranges start at age 18. A child gets no calibrated range for those markers, and the engine must use the lab range.
- When a range with `ancestry` matches the profile, the engine must use it in place of the range without `ancestry`. Tests make sure no two ranges with the same `sex` and `ancestry` overlap in age.
- `direction: "high_is_bad"` means every range has an open low side. `"low_is_bad"` means every range has an open high side. Tests check this.

### How the bounds were chosen

1. When the source has tiers (ADA glucose, ATP III lipids, KDIGO ACR and eGFR, AHA/CDC hs-CRP, EAS Lp(a), WHO anaemia), `optimal` and `watch` follow the tiers.
2. When the source gives only a reference interval (most Tietz and Dacie values), `optimal` is the reference interval and `watch` adds a margin of about 10 to 20% on each side. The margin is an editorial choice, not a published cut-off. The Tietz and Dacie intervals were not checked page by page against the printed editions, so a clinician must confirm them before launch.
3. Editorial choices that need clinical review:
   - `insulin_fasting` optimal upper bound 12 µIU/mL (narrower than the Tietz interval).
   - `homa_ir` optimal bound 2.0, and the `tg_hdl_ratio` optimal bound 2.0. The sources give only the high-risk cut-off (3.4 near the Gayoso-Diz 90th percentile, 2.86 from Endukuru for South Asians, 3.0 from McLaughlin), which sets the end of `watch`.
   - The `homa_ir` South Asian range rests on one study of 150 South Indian adults.
   - `bun_creatinine_ratio` 10 to 20 and `urea_creatinine_ratio`: no source was confirmed for the normal range. Only the prerenal threshold above 20 is well documented.
   - `hemoglobin` and `hematocrit` upper bounds.
   - `ast_alt_ratio`, which flags only a high ratio.
   - `urine_ph` optimal 5.0 to 7.5.
   - `pulse` and `heart_rate` watch 50 to 110 around the AHA 60 to 100.
   - `systolic_bp` and `diastolic_bp`: ACC/AHA elevated and stage 1 are watch, stage 2 is risk.
   - `bmi` watch 17 to 29.9 (WHO), and 17 to 27.4 for South Asian profiles, where WHO 2004 names 23 and 27.5 as action points.
   - `liver_length` optimal up to 16 cm and watch up to 17.4 cm. Kratzer 2003 counts livers over 16 cm and gives mean 14.0 and SD 1.7. It sets no upper limit.
   - `qtc_interval` watch up to 499 ms. Drew 2010 links over 500 ms with a 2 to 3 times higher torsade risk.

## Vitals and study measurements

- Category `vitals` (`height`, `weight`, `systolic_bp`, `diastolic_bp`, `pulse` and the derived `bmi`) sits in `markers`, so vitals are stored with lab markers and trend like them. `height` and `weight` have no range.
- Category `studies` holds `studyMarkers`. They are stored in `study_measurements`, not with the markers.
- Both categories get a status only. `countsInScore` keeps them out of the score, the verdict, move first and follow-ups.
- Only measurements with a published cut-off have a range: heart rate, QTc, liver length, pulse, blood pressure and BMI. Spleen length (Chow 2016 gives a limit by height and sex), kidney length (Emamian 1993 gives medians only), the other ECG intervals, the axes, Sokolow-Lyon, portal vein and CBD have no range and no status.
- MediWise copies these values from printed text. It never measures an image or a trace.

### South Asian ranges

Three markers have a South Asian range, because a published source gives a different threshold: `ldl_cholesterol` and `non_hdl_cholesterol` (Lipid Association of India) and `homa_ir` (Endukuru 2020, South Indian adults). Other markers with a `southAsianNote` (glucose, HbA1c, HDL, triglycerides, Lp(a), insulin, vitamin D, B12, homocysteine, hemoglobin, ferritin, TSH, anti-TPO) use the same cut-offs for everyone. The note cites the evidence and says that the range is the same. No range uses an invented cohort value.

## Units

- Each marker has one canonical unit. `conversions` maps other units to it: `canonical = value * factor + (offset ?? 0)`. Only HbA1c (IFCC mmol/mol) uses `offset`.

### Canonical unit rule

- A report stores each value in the unit the lab printed. The canonical value is derived from it with `conversions` and stored beside it.
- Scores, statuses, trends and comparisons use the canonical value, so two reports in different units line up.
- The report page and the marker page show the printed value and unit, and the canonical value on a second line when the number differs. Other views and the doctor export show the canonical value.
- A repeat of a scored marker in another unit, such as HbA1c in mmol/mol after %, is also stored in the canonical unit, so every row of a marker shares one unit.
- A unit that `conversions` does not list is never converted. The value keeps its printed unit and gets no status. A guessed conversion is worse than no status.
- Every unit in the unit table of `docs/research/international-lab-reports.md` converts. `normalise.test.ts` checks this with the verified factors.
- HbA1c is one marker. Percent is canonical, and mmol/mol converts with the NGSP equation (percent = 0.09148 x mmol/mol + 2.152). No glucose factor ever applies to it.
- Urea and BUN are two markers. Urea mmol/L x 6.006 = mg/dL, BUN mmol/L x 2.801 = mg/dL. No BUN name is an alias of urea.
- Panel names (FBC, CBC, U&E, LFT, Blutbild, NFS) are never marker aliases. The extraction prompt uses them as panel headings.
- Qualitative urine results use the unit `grade`: 0 negative or absent, 1 trace, 2 for 1+, 3 for 2+, 4 for 3+, 5 for 4+. Extraction maps the lab text to this number.
- Text-only markers (urine colour, peripheral smear lines, HBsAg) use the unit `text` and have no ranges. A text result is `unknown` and adds nothing to the score, unless one of the marker's `textRules` matches. A rule is a case-insensitive regex on the printed text, for example HBsAg and HCV "Reactive" are risk, "Non Reactive" is optimal, and anti-HBs "<2.0" is watch. A rule can carry a `followUp` at any status, and a risk rule must. The engine uses it for a text result in place of the numeric retest template.
- `lipoprotein_a` has no nmol/L conversion. The mg/dL to nmol/L factor depends on the isoform, so a fixed factor gives wrong values.

## Supplementable markers

`supplementable: true` marks a marker where a low value can lead to a supplement follow-up: `vitamin_d`, `vitamin_b12`, `folate`, `iron` and `ferritin`. Ferritin is included because it is the usual test for low iron stores. The engine never names a dose. The follow-up tells the user to ask a doctor.

## Suggestion tables

`advice.ts` holds the catalog data for suggestions (MEDI-158). `hi/lifestyle.ts` holds the Hindi lines.

- `lifestyle`: for each marker with a sourced lifestyle lever, the side the habits address (`high` or `low`), 1 to 3 habits, 1 to 3 things that raise it, 1 to 3 things that lower it, and one source the marker cites. Markers that share one block (for example LDL, non-HDL and total cholesterol) share one habit suggestion. A marker with no sourced lever has no entry.
- `urgentLimits`: the limit past which a risk value gives a doctor-now suggestion, in the canonical unit, each side with its own source. Most limits are Kost 1990 critical limits. Glucose below 54 mg/dL is ADA 2025 level 2 low glucose, eGFR below 15 is KDIGO 2024 G5, and blood pressure above 180/120 mmHg is the ACC/AHA 2017 crisis level.
- No line names a dose, a medicine, a diet plan or a diagnosis. `forbidden-words.test.ts` checks every line and every rendered suggestion in both languages.
- The habit lines and the urgent limits are editorial choices from the cited sources. A clinician must review them before launch.

## Alias matching

`normalizeName` lower-cases the name, removes parentheses that contain a unit (a `/` or `%`, or `fL`, `pg`), changes `%` to `percent`, changes all other punctuation to spaces and collapses the spaces. Aliases are stored already normalised.

`findMarker(raw)` tries, in order:

1. The normalised name.
2. The name with all parenthesised text removed.
3. Each of these with a leading specimen word (`serum`, `s`, `sr`, `plasma`, `blood`) and a trailing `percent` removed.
4. The parts of the name split on parentheses, `-`, `:` and `,`. It resolves only when every part names the same marker.

`findMarker(raw, panel)` with a urine panel (a heading that contains "urin") searches only `urine_` keys. It tries the name, then "Urine " plus the name, then the name plus " Urine". A urine panel name never resolves to a blood marker, so urine "Bilirubin" is `urine_bilirubin` and not `bilirubin_total`. Every `urine` category key starts with `urine_`.

`findMarker(raw, panel, value)` under a heading that contains "smear" maps a text result whose name is a numeric count, such as a bare "RBC", "WBC" or "Platelets", to its smear marker (`smear_rbc`, `smear_wbc`, `smear_platelets`). A number under the same heading keeps its count marker.

A name that matches nothing returns `undefined`. Do not add a loose alias to force a match. A wrong match is worse than an unmapped marker.

## Derived markers

A derived marker has every marker field plus a `formula`. Labs often print these values, so they resolve through `findMarker` like any marker. Formula kinds: `ratio` (with optional `scale`), `difference`, `linear`, `homa_ir`, `ckd_epi_2021`, `bmi` (weight in kg over height in metres squared). `computeDerived` takes values in canonical units and returns `undefined` when an input is missing. It does not compute eGFR under age 18.

## Core markers

The 16 core markers define a comprehensive panel and drive the coverage cap:

| Area              | Markers                                                                                    | Why                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Blood             | `hemoglobin`                                                                               | Anaemia is very common in India (NFHS-5).                                                                                                |
| Sugar             | `glucose_fasting`, `hba1c`, `insulin_fasting`                                              | Diabetes and prediabetes affect about 1 in 4 Indian adults. Insulin finds insulin resistance years earlier.                              |
| Lipids            | `ldl_cholesterol`, `hdl_cholesterol`, `triglycerides`, `apolipoprotein_b`, `lipoprotein_a` | Indians get heart disease about a decade earlier (LAI). ApoB counts harmful particles. Lp(a) is inherited and is higher in South Asians. |
| Inflammation      | `hs_crp`                                                                                   | An independent heart risk signal.                                                                                                        |
| Kidney            | `creatinine`                                                                               | Gives eGFR.                                                                                                                              |
| Liver             | `alt`                                                                                      | The most liver-specific routine enzyme, and the first sign of fatty liver.                                                               |
| Thyroid           | `tsh`                                                                                      | Hypothyroidism affects about 1 in 10 Indian adults.                                                                                      |
| Vitamins and iron | `vitamin_d`, `vitamin_b12`, `ferritin`                                                     | Common deficiencies in India that cause symptoms and are easy to correct.                                                                |

Left out on purpose: `total_cholesterol` (LDL, HDL and ApoB cover it), `uric_acid` and `homocysteine` (useful but secondary), `urine_acr` (important but missing from most panels, so it would cap almost every report), and the full blood count indices (`hemoglobin` stands for them).

Standard Indian panels skip `insulin_fasting`, `apolipoprotein_b`, `lipoprotein_a` and `hs_crp`. A report without them cannot be fully comprehensive. That is the intent: the unmeasured list tells the user what to add.

US and UK panels have the same gaps. A US routine check usually orders a CMP (comprehensive metabolic panel) or a BMP (basic metabolic panel), a CBC (complete blood count) and a lipid panel. The CMP gives glucose, electrolytes, calcium, BUN, creatinine, proteins and the liver enzymes. The BMP leaves out the liver part. A UK GP usually orders an FBC (full blood count), U&E (urea, electrolytes and creatinine, with eGFR) and LFT (liver function tests), and adds HbA1c and lipids when needed. These panels give `hemoglobin`, glucose, `creatinine`, `alt` and the standard lipids. They skip `insulin_fasting`, `apolipoprotein_b`, `lipoprotein_a` and `hs_crp`, and include `tsh`, `vitamin_d`, `vitamin_b12` and `ferritin` only when a doctor asks. US labs print BUN and UK labs print urea, so the catalog keeps both as separate markers.

## Known limits

- LH, FSH and estradiol have male ranges only. Female values depend on the cycle day, and the range schema has no cycle phase.
- Anti-TPO, PDW and immature granulocyte cut-offs differ between test kits and analysers. The copy tells the user to compare with the lab range.
- Pregnancy ranges are not in the catalog.

## Add a marker

1. Add the source to `sources.ts` if it is new. The key and the `id` must be the same.
2. Add the marker to its category file. Give at least 3 aliases, normalised.
3. Every range cites a source that is in the marker's `sources`.
4. `whatItIs`, `whyItMatters` and `whatMovesIt` are 2 to 3 sentences each. `description` is under 90 characters.
5. Add `southAsianNote` only when a source supports it. Add `ancestry` to a range only when a source publishes a different threshold.
6. Never rename a `key`. Stored reports reference it.
7. Run `pnpm --filter engine test`.
