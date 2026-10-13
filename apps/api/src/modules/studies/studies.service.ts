import type Anthropic from "@anthropic-ai/sdk";
import { derived, type EngineValue, markers, studyMarkers } from "@mediwise/engine";
import { type PageClass, type StudyKind, studyKinds } from "@mediwise/shared";
import { z } from "zod";
import { callTool, type ReportPage, type StepUsage } from "../extraction/index.js";

export type StudyPage = { page: ReportPage; pageClass: PageClass; pageIndex: number };

export type StudyMeasurement = {
  key: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  printedRange: string | null;
};

export type StudyDraft = {
  kind: StudyKind;
  pageIndex: number;
  bodyRegion: string | null;
  findingsText: string | null;
  impressionText: string | null;
  familyHistory: string | null;
  specimen: string | null;
  adequacy: string | null;
  resultText: string | null;
  performedAt: string | null;
  signedBy: string | null;
  measurements: StudyMeasurement[];
};

const vitalEntries = [...markers, ...derived].filter((entry) => entry.category === "vitals");
const vitalKeys = new Set(vitalEntries.map((entry) => entry.key));
const measurementEntries = [...vitalEntries, ...studyMarkers];
const measurementKeys = measurementEntries.map((entry) => entry.key) as [string, ...string[]];
const unitOf = new Map(vitalEntries.map((entry) => [entry.key, entry.unit]));
const plausible: Record<string, [number, number]> = {
  height: [100, 250],
  weight: [20, 300],
  systolic_bp: [50, 300],
  diastolic_bp: [30, 200],
  pulse: [20, 250],
  bmi: [10, 80],
};

const printed = z.string().nullable();

/**
 * What the study tool returns: one entry per study, with its measurements as short tuples.
 *
 * @remarks
 * Keys come from a fixed list, so a measurement never needs a second mapping call. A size such as "90 x 44" stays text.
 */
const studiesSchema = z.object({
  ageYears: z.number().optional().describe("Patient age in years, as printed"),
  labName: z.string().trim().min(1).optional(),
  studies: z.array(
    z.object({
      page: z.number().int(),
      kind: z.enum(studyKinds),
      bodyRegion: printed,
      performedAt: z.iso.date().nullable(),
      signedBy: printed,
      findings: printed,
      impression: printed,
      familyHistory: printed,
      specimen: printed.optional(),
      adequacy: printed.optional(),
      result: printed.optional(),
      measurements: z
        .array(
          z.tuple([
            z.enum(measurementKeys),
            z.union([z.number(), z.string()]),
            z.string().nullable(),
            z.string().nullable(),
          ]),
        )
        .describe("[key, value, unit, range]"),
    }),
  ),
});

const studiesSystem = `You copy what is printed on health check pages: imaging reports, ECG printouts, medical examination forms and pathology reports. Call the record_studies tool once.

- Copy only printed words and printed numbers. Never compute, convert, round or infer a value.
- Never read an X-ray film, a scan image or an ECG trace. Read only the text and numbers that are printed or written on the page.
- Never interpret a result. Do not judge whether a value is normal.
- studies has one entry for each report on the pages. page is the number of the page where the report starts.
- kind is xray, ultrasound, ct, mri, ecg, examination for a medical examination or fitness form, pathology for a cytology, histopathology, biopsy, PAP smear or FNAC report, or other.
- bodyRegion is the body part as printed, for example "Chest PA" or "Abdomen and pelvis", or null.
- performedAt is the date of the study as YYYY-MM-DD, or null when no date is printed. Printed dates put the day first, so 01.02.2025 is 2025-02-01.
- signedBy is the name of the doctor who signed, as printed, or null.
- findings is the findings text as printed, one line for each organ or finding. For an examination form, use one "Field: value" line for each clinical examination field and for vision. Use null when there are no findings.
- impression is the impression or conclusion as printed, one sentence per line. Leave out advice lines such as "Kindly correlate clinically". For an ECG, copy each printed interpretation line, one per line. For an examination form, copy the fitness verdict and the doctor's comments. Use null when none is printed.
- familyHistory is the family history of an examination form as written, or null.
- specimen, adequacy and result are for a pathology report only. Use null for every other kind.
- specimen is the specimen type as printed, for example "Cervical smear". adequacy is the specimen adequacy as printed.
- result is the printed result line. For a PAP smear, copy the Bethesda general categorisation, for example "Negative for Intraepithelial Lesion or Malignancy". For a biopsy or FNAC, copy the printed diagnosis line.
- For a pathology report, findings is the microscopy text as printed, and impression is the printed impression. Leave out notes about the test method.
- measurements has one entry for each printed measurement that has a key in the list below. Each entry has exactly 4 items: [key, value, unit, range].
- value is a number when one number is printed. Copy a size with two numbers, such as "90 x 44", as text.
- A blood pressure written as 107/67 is two entries: systolic_bp 107 and diastolic_bp 67.
- unit is the printed unit, or null. range is the printed reference range, or null.
- Skip a printed value that has no key in the list. Skip a field that is empty on the page.
- Never copy the patient's name, phone number, email address, employer, address or any ID number.
- ageYears is the patient's age in years as printed. Leave it out when no age is printed.
- labName is the lab, hospital or imaging centre printed on the letterhead of page 1, for example "Lakeview Imaging Centre". It is never a doctor or a patient. Leave it out when no letterhead is printed.

Keys, one key: name per line:
${measurementEntries.map(({ key, name }) => `${key}: ${name}`).join("\n")}`;

const studiesTool: Anthropic.Tool = {
  name: "record_studies",
  description:
    "Records each imaging report, ECG printout, examination form and pathology report, copied as printed.",
  input_schema: z.toJSONSchema(studiesSchema) as Anthropic.Tool.InputSchema,
};

const classNames: Partial<Record<PageClass, string>> = {
  imaging_report: "an imaging report",
  ecg_printout: "an ECG printout",
  examination_form: "an examination form",
  pathology_report: "a pathology report",
};

function pageBlocks(pages: StudyPage[]) {
  return pages.flatMap(({ page, pageClass }, index): Anthropic.ContentBlockParam[] => {
    const label = `Page ${index + 1} is ${classNames[pageClass] ?? "a health check page"}`;
    if ("text" in page)
      return [{ type: "text", text: `${label}:\n<page ${index + 1}>\n${page.text}\n</page>` }];
    const mediaType = page.mime as Anthropic.Base64ImageSource["media_type"];
    return [
      { type: "text", text: `${label}, as an image:` },
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: page.image.toString("base64") },
      },
    ];
  });
}

const blank = (text: string | null) => (text?.trim() ? text.trim() : null);

/** Drops a printed "Impression:" or "Conclusion:" label from the start of each line. */
function withoutLabel(text: string | null) {
  return text?.replace(/^\s*(final\s+)?(impression|conclusion)\s*:\s*/gim, "") ?? null;
}

/**
 * Turns one printed measurement into a value MediWise can score and trend.
 *
 * @remarks
 * A size such as "90 x 44" keeps its text and takes the first number, the length, as its value. A vital printed with no
 * unit takes the catalog unit only when the value is plausible in it, because a handwritten form often prints the unit
 * in the field label. A printed range without a number, such as "(Bazett)", is a note and is dropped.
 */
export function toMeasurement(
  key: string,
  value: number | string,
  unit: string | null,
  range: string | null,
): StudyMeasurement {
  const text = typeof value === "string" ? value.trim() : null;
  const size = text ? /^(\d+(?:\.\d+)?)\s*[x×*]\s*\d+(?:\.\d+)?$/i.exec(text) : null;
  const plain = text && /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
  const number = typeof value === "number" ? value : (plain ?? (size ? Number(size[1]) : null));
  const [low, high] = plausible[key] ?? [Infinity, -Infinity];
  const assumed = !blank(unit) && number !== null && number >= low && number <= high;
  return {
    key,
    value: number,
    valueText: plain === null ? text : null,
    unit: assumed ? (unitOf.get(key) ?? null) : blank(unit),
    printedRange: range && /\d/.test(range) ? range.trim() : null,
  };
}

/**
 * Reads the studies on one file's study pages with one Claude call, and returns them with the age and lab as printed.
 *
 * @remarks
 * A result that fails validation gets one more call with the errors, then the file has no studies. A study page that
 * Claude cannot read never fails the lab read of the same report.
 */
export async function readStudies(pages: StudyPage[], usage: StepUsage) {
  const none = { studies: [] as StudyDraft[], ageYears: undefined, labName: undefined };
  if (pages.length === 0) return none;
  const blocks = pageBlocks(pages);
  const ask = "Record every study on these pages with the record_studies tool.";
  let errors = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const input = await callTool(
      studiesTool,
      studiesSystem,
      [
        ...blocks,
        {
          type: "text",
          text: errors ? `${ask}\n\nYour previous call failed validation:\n${errors}` : ask,
        },
      ],
      usage,
    );
    const parsed = studiesSchema.safeParse(input);
    if (parsed.success) {
      const studies = parsed.data.studies.map((study): StudyDraft => {
        const seen = new Set<string>();
        return {
          kind: study.kind,
          pageIndex: pages[Math.min(Math.max(study.page - 1, 0), pages.length - 1)]?.pageIndex ?? 0,
          bodyRegion: blank(study.bodyRegion),
          findingsText: blank(study.findings),
          impressionText: blank(withoutLabel(study.impression)),
          familyHistory: blank(study.familyHistory),
          specimen: blank(study.specimen ?? null),
          adequacy: blank(study.adequacy ?? null),
          resultText: blank(study.result ?? null),
          performedAt: study.performedAt,
          signedBy: blank(study.signedBy),
          measurements: study.measurements.flatMap(([key, value, unit, range]) => {
            if (seen.has(key)) return [];
            seen.add(key);
            return [toMeasurement(key, value, unit, range)];
          }),
        };
      });
      return { studies, ageYears: parsed.data.ageYears, labName: parsed.data.labName };
    }
    errors =
      input === undefined ? "No record_studies call was made." : z.prettifyError(parsed.error);
  }
  return none;
}

/** Tells whether a measurement key is a vital, which the report keeps with its markers. */
export function isVital(key: string) {
  return vitalKeys.has(key);
}

/** Turns the vitals of every study into engine values, the first of each key only. */
export function vitalValues(studies: StudyDraft[]): EngineValue[] {
  const seen = new Set<string>();
  return studies.flatMap((study) =>
    study.measurements.flatMap((measurement) => {
      if (!isVital(measurement.key) || measurement.value === null || seen.has(measurement.key)) {
        return [];
      }
      seen.add(measurement.key);
      return [
        {
          rawName:
            measurementEntries.find((entry) => entry.key === measurement.key)?.name ??
            measurement.key,
          markerKey: measurement.key,
          value: measurement.value,
          unit: measurement.unit ?? undefined,
        },
      ];
    }),
  );
}
