import type Anthropic from "@anthropic-ai/sdk";
import { derived, findMarker, fitsPanel, markers, toCanonical } from "@mediwise/engine";
import {
  type ExtractedMarker,
  type ExtractedReport,
  extractedReportSchema,
} from "@mediwise/shared";
import { z } from "zod";
import { AppError } from "../../common/errors.js";
import { anthropic } from "../../lib/anthropic.js";
import {
  compactPageTexts,
  pdfPageTexts,
  renderPdfHeader,
  renderPdfPage,
} from "../../lib/poppler.js";
import { checkedLabName } from "./extraction.header.js";
import { addUsage, type StepUsage } from "./extraction.usage.js";

export type ReportFileData = { mime: string; data: Buffer };
export type ReportPage = { text: string; header?: Buffer } | { mime: string; image: Buffer };
export type MarkerMapping = { markerKey: string | null; suggested: boolean };

const maxTokens = 16_000;
const catalog = [...markers, ...derived];
const catalogByKey = new Map(catalog.map((entry) => [entry.key, entry]));

const text = z.string().trim().min(1);

/**
 * What the extraction tool returns: each panel name once, with one short tuple per printed result under it.
 *
 * @remarks
 * Tuples instead of named fields cut the output tokens by half on a 100-row report. Rows sit under their panel, because
 * claude-haiku-5-5 drifted by one or two when it had to point at a panel by index.
 */
const compactReportSchema = z.object({
  labName: text.optional(),
  referredBy: text.optional(),
  packageName: text.optional(),
  age: z
    .union([z.number(), text])
    .optional()
    .describe("Patient age exactly as printed, for example 24 Y 8 M 21 D"),
  collectedAt: z.iso.date().optional(),
  reportedAt: z.iso.date().optional(),
  dateAmbiguous: z
    .boolean()
    .optional()
    .describe(
      "true only when the document does not show whether dates are day first or month first",
    ),
  panels: z.array(
    z.object({
      name: z.string().nullable(),
      rows: z
        .array(
          z.tuple([
            text,
            z.union([z.number(), text]),
            z.string().nullable(),
            z.string().nullable(),
            z.number().int(),
          ]),
        )
        .describe("[name, value, unit, range, page]"),
    }),
  ),
});
type CompactReport = z.infer<typeof compactReportSchema>;

const mapMarkersSchema = z.object({
  mappings: z.array(z.object({ index: z.number().int(), markerKey: z.string().nullable() })),
});

const extractionSystem = `You read laboratory reports and record what is printed. Call the record_extraction tool once.

- Extract only. Copy every value exactly as printed. Never compute, convert, round or infer a value.
- Never interpret a result. Do not judge whether a value is normal or not.
- The report comes as numbered pages. A text page is the printed text with its column layout. An empty column means the field is not printed. Other pages are images.
- panels lists the test groups in printed order. name is the main heading of the group, for example "Complete Blood Count" or "Complete Urine Examination", or null when no heading is printed. Do not use a sub-heading such as "Microscopic Examination".
- Panel headings come in many languages and short forms, for example CBC, FBC, Blutbild, NFS, Hemograma, Emocromo, U&E, BMP, CMP, LFT, Hepatic function panel and Lipid panel. Such a heading is a panel name, never a test name.
- rows has one entry per printed test result of the group, in printed order. Each entry has exactly 5 items: [name, value, unit, range, page].
- name is the test name exactly as printed. A name or a value printed over two lines is one name or one value.
- value is a number only when the printed result is a plain number. Otherwise copy the printed text, for example "Negative" or "<5".
- A decimal comma is a decimal point. "4,5" is the number 4.5.
- "1.234" or "1,234" can be a thousands separator or a decimal mark. Pick the reading that fits the usual range of that test.
- A flag printed beside the value is not part of the value. For "115 H", "5.2 *", "88 L", "140 A" or a value with an arrow, value is the number only.
- value is always the current result. Some reports print earlier results in another column, for example the French "Antériorités" or a history column. Never copy an earlier result.
- A test printed in two units, for example HbA1c in % and in mmol/mol, gives one row per printed value, each with its own unit.
- unit is the printed unit, or null. Never convert a unit. When the unit is printed only inside the range, for example "<5.7 % of total Hgb", copy it into unit too.
- range is the printed reference range, verbatim, or null, for example "> OR = 46", "<5.7" or "4,5 - 5,9". Join a range printed over several lines with ", ", for example a Female line and a Male line.
- Headers can be in two languages, for example Arabic beside English, French ("Résultats", "Valeurs de référence") or German ("Befund", "Referenzbereich"). A header is never a test.
- When a test name is printed in two languages, copy the English name, or the name in Latin letters when no English name is printed.
- When the report names the eGFR equation, add it to the eGFR name in parentheses, for example "eGFR (CKD-EPI 2021)". The equation can be CKD-EPI 2021, CKD-EPI 2009, MDRD or Cockcroft-Gault, and it can be printed on another line.
- page is the number of the page the result is printed on.
- A peripheral smear finding keeps the "Peripheral Smear" prefix in name, for example "Peripheral Smear RBC", also when the line prints only "RBC".
- Reference tables, method names and interpretation text are not results. Skip them.
- labName is the laboratory that ran the tests, from the letterhead or logo at the top of page 1, for example "GF Greenfield Health & Diagnostic Centre". It is never a doctor, a patient or a health check package.
- A US report can print three header boxes: Patient Information, Specimen Information and Client Information. The Client Information box names the ordering practice, not the lab.
- A screenshot of a health app, for example an NHS App test results screen, names no lab. Leave out labName then.
- referredBy is the value after "Ref. By Doctor", "Ref Doctor", "Referred By" or "Ordering Physician", for example "CARE PLUS".
- packageName is the health check package printed above the results, for example "Care Plus (Acme Insure - Package 5)".
- collectedAt is the sample collection date, for example "Collection Time : 01-Feb-2025 09:00 AM" gives 2025-02-01. Other labels are "Collected", "Date taken", "Entnahme" and "Prélèvement".
- reportedAt is the report date, for example "Report Print Time : 01-Feb-2025 04:05 PM" gives 2025-02-01. Another label is "Reported". On a US report, "Received" is the date the lab got the sample, so it is neither date.
- Write dates as YYYY-MM-DD. Leave out any field that is not printed.
- Printed dates can be MM/DD/YYYY (US), DD/MM/YYYY (UK, Europe, Australia, India), DD.MM.YYYY (Germany) or YYYY-MM-DD. Decide the order from the document: its language, the lab, the unit system (mg/dL points to the US, mmol/L to elsewhere) and any printed date whose first or second part is above 12.
- Set dateAmbiguous to true only when these clues do not decide the order and a date has both parts at 12 or below. Still write the most likely reading.`;

const mappingSystem = `You match lab test names to a marker catalog. Call the map_markers tool once, with one entry for each test.
Each test comes with its panel and unit. A test in a urine panel maps only to a urine_ key, for example a bare "Protein" is urine_protein.
Use a catalog key only when the test clearly is the same test. When unsure, use null.

Catalog, one key: name per line:
${catalog.map(({ key, name }) => `${key}: ${name}`).join("\n")}`;

const extractionTool: Anthropic.Tool = {
  name: "record_extraction",
  description: "Records every test result printed in the report, copied as printed.",
  input_schema: z.toJSONSchema(compactReportSchema) as Anthropic.Tool.InputSchema,
};

const mappingTool: Anthropic.Tool = {
  name: "map_markers",
  description: "Records the catalog key for each raw lab test name, or null.",
  input_schema: z.toJSONSchema(mapMarkersSchema) as Anthropic.Tool.InputSchema,
};

/**
 * Picks the request setting that turns thinking off on this model.
 *
 * @remarks
 * claude-sonnet-5-5 rejects `disabled` and takes `between_tools` instead. Every other model here takes `disabled`.
 */
function thinkingOff(model: string): Anthropic.ThinkingConfigParam {
  return model === "claude-sonnet-5-5" ? { type: "between_tools" } : { type: "disabled" };
}

/**
 * Sends one request that offers a single tool and returns that tool's input, or `undefined` when Claude did not call it.
 *
 * @remarks
 * claude-sonnet-5-5 rejects a forced `tool_choice`, so the call uses `auto` and a system prompt that names the tool.
 * `strict: true` made it return an empty marker list on a 25-page report, so zod validates the result instead.
 */
export async function callTool(
  tool: Anthropic.Tool,
  system: string,
  content: Anthropic.ContentBlockParam[],
  usage: StepUsage,
) {
  const response = await anthropic.messages.create({
    model: usage.model,
    max_tokens: maxTokens,
    thinking: thinkingOff(usage.model),
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    tools: [tool],
    tool_choice: { type: "auto", disable_parallel_tool_use: true },
    messages: [{ role: "user", content }],
  });
  addUsage(usage, response.usage);
  if (response.stop_reason === "refusal") throw new Error(`Claude declined the ${tool.name} call`);
  if (response.stop_reason === "max_tokens") {
    throw new Error(`The ${tool.name} call ran past ${maxTokens} output tokens`);
  }
  const call = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === tool.name,
  );
  return call?.input;
}

function imageBlock(mime: string, data: Buffer): Anthropic.ImageBlockParam {
  const mediaType = mime as Anthropic.Base64ImageSource["media_type"];
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: data.toString("base64") },
  };
}

/**
 * Splits one report file into pages: the text layer where a PDF page has one, an image where it does not.
 *
 * @remarks
 * Text costs about a tenth of the same page sent as a PDF document. A PDF that pdftotext cannot read fails the read,
 * because every page must be classified before anything is kept.
 */
export async function readPages(file: ReportFileData): Promise<ReportPage[]> {
  if (file.mime !== "application/pdf") return [{ mime: file.mime, image: file.data }];
  const texts = await pdfPageTexts(file.data);
  if (!texts) throw new Error("pdftotext could not read the PDF");
  return Promise.all(
    texts.map(async (text, index) => {
      if (text === null)
        return { mime: "image/jpeg", image: await renderPdfPage(file.data, index) };
      return index === 0 ? { text, header: await renderPdfHeader(file.data) } : { text };
    }),
  );
}

/** Numbers the pages for Claude, shrinks the text pages and puts the letterhead strip of page 1 first. */
function reportContent(pages: ReportPage[]) {
  const compact = compactPageTexts(pages.map((page) => ("text" in page ? page.text : "")));
  const first = pages[0];
  const header: Anthropic.ContentBlockParam[] =
    first && "header" in first && first.header
      ? [
          { type: "text", text: "The top of page 1 as an image, for the letterhead:" },
          imageBlock("image/jpeg", first.header),
        ]
      : [];
  return header.concat(
    pages.flatMap((page, index): Anthropic.ContentBlockParam[] =>
      "text" in page
        ? [{ type: "text", text: `<page ${index + 1}>\n${compact[index]}\n</page>` }]
        : [
            { type: "text", text: `Page ${index + 1} is an image:` },
            imageBlock(page.mime, page.image),
          ],
    ),
  );
}

const [enDash, atMost, atLeast] = [0x2013, 0x2264, 0x2265].map((code) => String.fromCharCode(code));
const rangeNumber = String.raw`(-?\d+(?:\.\d+)?)`;
const between = new RegExp(String.raw`${rangeNumber}\s*(?:-|${enDash}|to)\s*${rangeNumber}`, "i");
const below = new RegExp(String.raw`(?:<=?|${atMost}|<\/=|up\s*to)\s*${rangeNumber}`, "i");
const above = new RegExp(String.raw`(?:>=?|${atLeast}|>\/=)\s*${rangeNumber}`, "i");

/**
 * Rewrites printed numbers with a point as the decimal mark and no thousands separator.
 *
 * @remarks
 * A text with a sure decimal comma ("0,35", or 1 or 2 final digits as in "4,5") reads every comma as a decimal mark, so
 * "0,270 - 4,200" is 0.27 to 4.2. Otherwise a comma before 3 digits, or before 2 digits and another comma (Indian
 * "1,50,000"), separates thousands.
 */
function plainNumbers(text: string) {
  const decimalComma = /(?<![\d.,])0,\d|\d,\d{1,2}(?![\d,])/.test(text);
  return decimalComma
    ? text.replace(/(\d),(?=\d)/g, "$1.")
    : text.replace(/(\d),(?=\d{3}\b|\d{2},\d)/g, "$1");
}

/**
 * Reads the low and high bounds out of a printed range, only when it prints a single range.
 *
 * @remarks
 * "13 - 17" gives both bounds, "> 90" and "> OR = 90" only the low one and "< 200" only the high one. A range with several categories,
 * such as Desirable and Borderline, has more numbers than one range and gives no bounds.
 */
export function printedRange(range: string | null | undefined) {
  const printed = plainNumbers(range ?? "").replace(/\s*\bOR\s*=/gi, "=");
  const numbers = printed.match(/\d+(?:\.\d+)?/g) ?? [];
  const pair = between.exec(printed);
  if (numbers.length === 2 && pair) {
    return { referenceLow: Number(pair[1]), referenceHigh: Number(pair[2]) };
  }
  if (numbers.length !== 1) return {};
  const high = below.exec(printed);
  if (high) return { referenceHigh: Number(high[1]) };
  const low = above.exec(printed);
  return low ? { referenceLow: Number(low[1]) } : {};
}

const flaggedNumber = /^(-?\d+(?:\.\d+)?)\s*(?:HH?|LL?|A|\*{1,3}|\u2191|\u2193)?$/u;

/**
 * Turns a value printed as a number, with or without a flag such as "H" or "*", into a number, and keeps any other text.
 *
 * @remarks
 * claude-haiku-5-5 sometimes returns "102.10" or "115 H" as a string although the prompt asks for a plain number.
 */
export function printedValue(value: number | string) {
  if (typeof value !== "string") return value;
  const number = flaggedNumber.exec(plainNumbers(value.trim()))?.[1];
  return number === undefined ? value : Number(number);
}

/**
 * Reads the years, months and days out of a printed age such as "24 Y 8 M 21 D /M" or "25 Yrs 5 Month 11 Days".
 *
 * @remarks
 * A number with a unit counts, so the "/M" of a printed sex is never read as months. A bare number is years.
 */
export function printedAge(age: number | string | undefined) {
  const printed = String(age ?? "");
  const part = (units: string) =>
    printed.match(new RegExp(String.raw`(\d+)\s*(?:${units})\b`, "i"))?.[1];
  const [years, months, days] = [
    part("y|yrs?|years?"),
    part("m|mos?|mon|mths?|months?"),
    part("d|days?"),
  ];
  if (!years && !months && !days) {
    const bare = /^\s*(\d+)/.exec(printed)?.[1];
    return bare ? { ageYears: Number(bare) } : undefined;
  }
  return {
    ageYears: Number(years ?? 0),
    ageMonths: months === undefined ? undefined : Number(months),
    ageDays: days === undefined ? undefined : Number(days),
  };
}

function expandReport(report: CompactReport, firstPage: string | undefined): ExtractedReport {
  const labName = checkedLabName(report, firstPage);
  return {
    lab: labName ? { name: labName } : undefined,
    patient: printedAge(report.age),
    collectedAt: report.collectedAt,
    reportedAt: report.reportedAt,
    dateAmbiguous: report.dateAmbiguous,
    markers: report.panels.flatMap(({ name, rows }) =>
      rows.map(([rawName, value, unit, range, page]) => ({
        rawName,
        panel: name?.trim() || undefined,
        value: printedValue(value),
        unit: unit && /[\p{L}\d%]/u.test(unit) ? unit.trim() : undefined,
        referenceText: range?.trim() || undefined,
        ...printedRange(range),
        pageIndex: Math.max(page - 1, 0),
      })),
    ),
  };
}

/**
 * Reads every printed test off the report pages with Claude and validates the result.
 *
 * @remarks
 * A result that fails validation gets one more call with the errors appended, then the read fails.
 */
export async function extractReport(pages: ReportPage[], usage: StepUsage) {
  const blocks = reportContent(pages);
  const ask = "Record every test result printed in this report with the record_extraction tool.";
  let errors = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = errors
      ? `${ask}\n\nYour previous record_extraction call failed validation:\n${errors}\nCall it again with every test, corrected.`
      : ask;
    const input = await callTool(
      extractionTool,
      extractionSystem,
      [...blocks, { type: "text", text: prompt }],
      usage,
    );
    const parsed = compactReportSchema.safeParse(input);
    if (parsed.success) {
      const first = pages[0];
      const firstPage = first && "text" in first ? first.text : undefined;
      return extractedReportSchema.parse(expandReport(parsed.data, firstPage));
    }
    errors =
      input === undefined ? "No record_extraction call was made." : z.prettifyError(parsed.error);
  }
  throw new AppError(
    422,
    "We could not read the values in this report. Upload clearer photos or a PDF.",
  );
}

/**
 * Maps each extracted marker to a catalog key, by alias first and then by asking Claude for the ones left over.
 *
 * @remarks
 * Claude sees only the names the aliases missed, each with its panel and unit, and answers come back by index. An answer
 * that does not fit the panel, or whose unit does not convert, stays unmapped.
 */
export async function mapMarkers(
  extracted: ExtractedMarker[],
  usage: StepUsage,
): Promise<MarkerMapping[]> {
  const byAlias = extracted.map(
    (marker) => findMarker(marker.rawName, marker.panel, marker.value)?.key ?? null,
  );
  if (!byAlias.includes(null)) {
    return byAlias.map((markerKey) => ({ markerKey, suggested: false }));
  }

  const printed = extracted.flatMap(({ rawName, panel, unit }, index) =>
    byAlias[index] === null ? [{ index, rawName, panel, unit }] : [],
  );
  const input = await callTool(
    mappingTool,
    mappingSystem,
    [{ type: "text", text: `Tests:\n${JSON.stringify(printed)}` }],
    usage,
  );
  const answers = new Map(
    (mapMarkersSchema.safeParse(input).data?.mappings ?? []).map((m) => [m.index, m.markerKey]),
  );

  return extracted.map((marker, i) => {
    const aliasKey = byAlias[i];
    if (aliasKey) return { markerKey: aliasKey, suggested: false };
    const entry = catalogByKey.get(answers.get(i) ?? "");
    const unitMismatch =
      typeof marker.value === "number" &&
      marker.unit !== undefined &&
      entry !== undefined &&
      toCanonical(entry, 1, marker.unit) === undefined;
    return entry && !unitMismatch && fitsPanel(entry.key, marker.panel)
      ? { markerKey: entry.key, suggested: true }
      : { markerKey: null, suggested: false };
  });
}
