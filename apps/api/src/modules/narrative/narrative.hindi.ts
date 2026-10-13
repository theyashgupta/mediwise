import type Anthropic from "@anthropic-ai/sdk";
import { hindiCopyProblems } from "@mediwise/engine";
import { z } from "zod";
import { callTool, type StepUsage } from "../extraction/index.js";

const hindiSchema = z.object({
  items: z
    .array(
      z.object({
        n: z.number().int().describe("The number of the English item"),
        text: z.string().trim().min(1).describe("The Hindi text of that item"),
      }),
    )
    .describe("One Hindi item for each English item, in the same order"),
});
type HindiItem = z.infer<typeof hindiSchema>["items"][number];

const hindiTool: Anthropic.Tool = {
  name: "write_hindi",
  description: "Records the Hindi text of each numbered English item of one report.",
  input_schema: z.toJSONSchema(hindiSchema) as Anthropic.Tool.InputSchema,
};

const system = `You put the text of one lab report from plain English into plain Hindi for an adult in India. The user message gives numbered English items and the printed names. Call the write_hindi tool once, with one Hindi item for each English item.

Form rules:
1. Write in Devanagari. Use everyday Hindi and the common loanword (रिपोर्ट, टेस्ट, वैल्यू, रेंज, मार्कर, डॉक्टर), not a Sanskrit word.
2. Give each Hindi item the number n of its English item. Each sentence has 20 Hindi words or fewer. End a sentence with "।" and a question with "?".
3. Do not use a semicolon. Use active voice.
4. Keep every number exactly as the English writes it, in Latin digits. Do not add or drop a number. Do not use Devanagari digits.
5. Keep every printed name exactly as the English writes it, in Latin script, for example HbA1c, LDL cholesterol or Vitamin D. Keep units (mg/dL), study names (ECG) and text in quotation marks as written.

Content rules:
6. Say what the English says and nothing more. Do not add a cause, a diagnosis, a drug, a dose or a fact. Do not drop a fact.
7. Keep every hedge. "May be low" becomes "कम हो सकता है", never "कम है". Never make a hedge into a fact.
8. Use these status names: optimal is "सबसे अच्छा", watch is "ध्यान दें", risk is "जोखिम". A calibrated range is a "कैलिब्रेटेड रेंज".
9. Do not use the words "निदान" or "बीमारी" unless the English item names a diagnosis or a disease.

Example, as write_hindi input for the items "1. LDL cholesterol is 162 mg/dL, which has risk status." and "2. Vitamin D may be low. Retest it in 8 to 12 weeks.":
{"items":[{"n":1,"text":"LDL cholesterol 162 mg/dL है, जो जोखिम स्थिति में है।"},{"n":2,"text":"Vitamin D कम हो सकता है। 8 से 12 हफ़्ते में इसका दोबारा टेस्ट करें।"}]}`;

const diagnosisEn = /\bdiagnos|\bdisease\b/i;
const diagnosisHi = /निदान|बीमारी/;

export type HindiProblem = { message: string; index?: number };

/**
 * Lists every reason the Hindi items break the Hindi copy rules or do not match the English items one for one.
 *
 * @remarks
 * A problem with an `index` belongs to one item, so a retry can send back that item alone.
 */
export function validateHindi(english: string[], items: HindiItem[], printedNames: string[]) {
  const problems: HindiProblem[] = [];
  english.forEach((source, index) => {
    const found = items.filter(({ n }) => n === index + 1);
    if (found.length !== 1) {
      problems.push({ index, message: `Write item ${index + 1} exactly once.` });
      return;
    }
    const text = found[0]!.text;
    for (const problem of hindiCopyProblems(text, source, printedNames)) {
      problems.push({ index, message: `It ${problem}.` });
    }
    if (!diagnosisEn.test(source) && diagnosisHi.test(text)) {
      problems.push({ index, message: "It uses a diagnosis word." });
    }
  });
  const extra = items.filter(({ n }) => n < 1 || n > english.length);
  if (extra.length > 0) problems.push({ message: `Write only items 1 to ${english.length}.` });
  return problems;
}

function numbered(texts: string[], numbers: number[]) {
  return texts.map((text, i) => `${numbers[i]}. ${text}`).join("\n");
}

/**
 * Puts the English report text into Hindi and returns each English string with its Hindi text once every item passes.
 *
 * @remarks
 * A rejected call gets one more call with the failed items alone. A second rejection returns null, and the report
 * stays in English, so a reader never sees a mix of checked and unchecked Hindi.
 */
export async function writeHindi(
  english: string[],
  printedNames: string[],
  usage: StepUsage,
): Promise<Map<string, string> | null> {
  if (english.length === 0) return new Map();
  const names: Anthropic.TextBlockParam = {
    type: "text",
    text: `Printed names. Keep each one in Latin script as written: ${printedNames.join(", ") || "none"}.`,
  };
  const call = async (text: string) => {
    const input = await callTool(hindiTool, system, [names, { type: "text", text }], usage);
    const parsed = hindiSchema.safeParse(input);
    return parsed.success ? parsed.data.items : [];
  };

  const all = english.map((_, i) => i + 1);
  const first = await call(`English items:\n${numbered(english, all)}`);
  const problems = validateHindi(english, first, printedNames);
  if (problems.length === 0) return new Map(first.map(({ n, text }) => [english[n - 1]!, text]));
  if (problems.some(({ index }) => index === undefined)) return null;

  const failed = [...new Set(problems.map(({ index }) => index!))];
  const reasons = failed.map((index) => {
    const found = first.find(({ n }) => n === index + 1);
    const why = problems.filter((problem) => problem.index === index).map(({ message }) => message);
    return `${index + 1}. English: ${english[index]}\n   Your Hindi: ${found?.text ?? "none"}\n   ${why.join(" ")}`;
  });
  const fixes = await call(
    `We rejected these items. Write a new Hindi text for each one that passes every rule.\n${reasons.join("\n")}\nCall write_hindi with exactly these numbers: ${failed.map((index) => index + 1).join(", ")}.`,
  );
  const merged = [
    ...first.filter(({ n }) => !failed.includes(n - 1)),
    ...fixes.filter(({ n }) => failed.includes(n - 1)),
  ];
  if (validateHindi(english, merged, printedNames).length > 0) return null;
  return new Map(merged.map(({ n, text }) => [english[n - 1]!, text]));
}
