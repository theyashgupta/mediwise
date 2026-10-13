import type Anthropic from "@anthropic-ai/sdk";
import { derived, type EngineOutput, type EngineProfile, markers } from "@mediwise/engine";
import { type Narrative, narrativeHeadings } from "@mediwise/shared";
import { z } from "zod";
import { callTool, type StepUsage } from "../extraction/index.js";

const maxSentences = 12;
const maxWords = 20;
const diagnosisWords = /\byou have\b|\bdiagnos|\bdisease\b/i;
const names = new Map([...markers, ...derived].map((entry) => [entry.key, entry.name]));
const statusOrder = { risk: 0, watch: 1, optimal: 2, unknown: 3 };

/**
 * What the write_narrative tool returns: one flat list of sentences, each with its section and the keys it cites.
 *
 * @remarks
 * A flat list lets a retry send back only the failed items and put the new versions in the same places.
 */
function draftShape(key: z.ZodType<string>) {
  return z.object({
    sentences: z
      .array(
        z.object({
          section: z.enum(narrativeHeadings),
          text: z.string().trim().min(1).describe("One sentence of 20 words or fewer"),
          citedKeys: z.array(key).describe("Keys from the report key list that this sentence uses"),
        }),
      )
      .describe("12 sentences or fewer, in section order, the headline first"),
  });
}
const draftSchema = draftShape(z.string());
type Draft = z.infer<typeof draftSchema>;
type DraftSentence = Draft["sentences"][number];

export const narrativeExamples = [
  [
    ["The headline", "40 of 46 markers sit in your calibrated ranges.", []],
    ["The headline", "LDL cholesterol is the one to move first.", ["ldl_cholesterol"]],
    [
      "What stands out",
      "LDL cholesterol is 162 mg/dL, which has risk status.",
      ["ldl_cholesterol"],
    ],
    [
      "What stands out",
      "Triglycerides and HDL cholesterol have watch status.",
      ["triglycerides", "hdl_cholesterol"],
    ],
    [
      "What stands out",
      "Together they match the metabolic syndrome lipid triad pattern.",
      ["metabolic_lipid_triad"],
    ],
    ["What looks good", "HbA1c and fasting glucose are optimal.", ["hba1c", "glucose_fasting"]],
    ["What looks good", "Your kidney and liver markers are optimal.", ["egfr", "alt"]],
    [
      "What to do next",
      "Retest the lipid profile in 8 to 12 weeks.",
      ["ldl_cholesterol", "triglycerides"],
    ],
    ["What to do next", "Ask your doctor about your LDL cholesterol value.", ["ldl_cholesterol"]],
  ],
  [
    ["The headline", "17 of 18 markers sit in your calibrated ranges.", []],
    ["The headline", "Vitamin D is the one to move first.", ["vitamin_d"]],
    ["What stands out", "Vitamin D is 24 ng/mL, which has watch status.", ["vitamin_d"]],
    [
      "What looks good",
      "Your blood count markers are optimal.",
      ["hemoglobin", "wbc_count", "platelet_count"],
    ],
    ["What looks good", "TSH is optimal.", ["tsh"]],
    ["What to do next", "Retest vitamin D in 8 to 12 weeks.", ["vitamin_d"]],
  ],
].map((sentences) =>
  sentences.map(([section, text, citedKeys]) => ({ section, text, citedKeys })),
) as DraftSentence[][];

const system = `You explain one lab report to an adult in plain English. The user message gives the report facts and the report key list. Call the write_narrative tool once.

Form rules:
1. Write the sections in this order: "The headline", "What stands out", "What looks good", "What to do next".
2. Start with "The headline". Write one or two sentences there. Base it on the verdict.
3. Write 6 to 10 sentences in total. Never write more than ${maxSentences}.
4. Each sentence has ${maxWords} words or fewer. Aim for 15 words. Name three markers or fewer in one sentence.
5. Each sentences item holds one sentence. Do not use a semicolon. Use active voice. Do not use a phrasal verb.
6. Each sentence outside "The headline" cites one key or more in citedKeys. Do not write a sentence that you cannot cite, for example "Talk to your doctor about these results." Never cite a key only to meet this rule.
7. Copy each key in citedKeys exactly from the report key list. Cite each marker and pattern that the sentence names, and only those. Call each marker by its name in the key list.

Content rules:
8. Say what the report facts say and nothing more. Do not add a cause, a diagnosis or a fact that is not in the facts.
9. Keep every hedge. "May be low" stays "may be low". Never make a hedge into a fact.
10. Do not repeat every number. Give a value only when it helps the reader.
11. Do not use diagnosis words. Do not write "you have", "diagnosed" or "disease".
12. Do not name a drug. Do not give a supplement dose.
13. Use these words: report, marker, value, doctor, test, retest, calibrated range. Use the status names optimal, watch and risk.
14. Keep the medical names the report uses, for example HbA1c or LDL.

Two narratives that pass every rule, as write_narrative input:
${narrativeExamples.map((sentences) => JSON.stringify({ sentences })).join("\n")}`;

/**
 * Offers write_narrative with this report's keys as the only values citedKeys takes.
 *
 * @remarks
 * The parse still takes any string, so a key outside the list fails one sentence in the validator, not the whole call.
 */
function narrativeTool(keys: string[]): Anthropic.Tool {
  return {
    name: "write_narrative",
    description: "Records the plain-English narrative of one report, one cited sentence at a time.",
    input_schema: z.toJSONSchema(
      draftShape(z.enum(keys as [string, ...string[]])),
    ) as Anthropic.Tool.InputSchema,
  };
}

export type NarrativeRule =
  | "invalid_call"
  | "sections"
  | "too_many_sentences"
  | "long_sentence"
  | "semicolon"
  | "diagnosis_word"
  | "uncited"
  | "unknown_key";
export type NarrativeProblem = { rule: NarrativeRule; message: string; index?: number };
export type NarrativeUsage = StepUsage & { rejections?: NarrativeRule[] };

/**
 * Lists every reason a draft breaks the copy rules or cites a key that is not in this report.
 *
 * @remarks
 * An empty list means the draft is safe to store. A problem with an `index` belongs to one sentence, so a retry can
 * send back that sentence alone.
 */
export function validateNarrative(sentences: DraftSentence[], allowedKeys: Set<string>) {
  const problems: NarrativeProblem[] = [];
  if (!sentences.some(({ section }) => section === "The headline")) {
    problems.push({ rule: "sections", message: "Write a headline sentence." });
  }
  if (sentences.length > maxSentences) {
    problems.push({
      rule: "too_many_sentences",
      message: `Write ${maxSentences} sentences or fewer. You wrote ${sentences.length}.`,
    });
  }
  sentences.forEach(({ section, text, citedKeys }, index) => {
    const problem = (rule: NarrativeRule, message: string) =>
      problems.push({ rule, message, index });
    const words = text.split(/\s+/).length;
    if (words > maxWords)
      problem("long_sentence", `It has ${words} words. Use ${maxWords} or fewer.`);
    if (text.includes(";")) problem("semicolon", "It has a semicolon.");
    if (diagnosisWords.test(text)) problem("diagnosis_word", "It uses a diagnosis word.");
    if (section !== "The headline" && citedKeys.length === 0)
      problem("uncited", "It cites no key.");
    for (const key of citedKeys.filter((key) => !allowedKeys.has(key))) {
      problem("unknown_key", `It cites "${key}", which is not in this report.`);
    }
  });
  return problems;
}

/** Groups the draft sentences under the four headings, in heading order. */
function toNarrative(sentences: DraftSentence[]): Narrative {
  return {
    sections: narrativeHeadings.map((heading) => ({
      heading,
      sentences: sentences
        .filter(({ section }) => section === heading)
        .map(({ text, citedKeys }) => ({ text, markerKeys: citedKeys })),
    })),
  };
}

function range(low: number | null | undefined, high: number | null | undefined) {
  if (low == null && high == null) return "no range";
  if (low == null) return `${high} or less`;
  if (high == null) return `${low} or more`;
  return `${low} to ${high}`;
}

function bullets(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`) : ["- none"];
}

/**
 * Writes the engine facts Claude may use as short lines, with every marker and pattern key in one key list.
 *
 * @remarks
 * Unmeasured markers go in by name only, because they have no page for a citation to open.
 */
function reportFacts(output: EngineOutput, profile: EngineProfile) {
  const { overall, tier, coverage, capped } = output.score;
  const results = [...output.markers, ...output.derived].toSorted(
    (a, b) => statusOrder[a.status] - statusOrder[b.status],
  );
  const lines = [
    `Person: ${profile.ageYears} years, ${profile.sex}.`,
    `Score: ${Math.round(overall)} of 100, tier ${tier}${capped ? ", capped because the report measures few core markers" : ""}. Core markers measured: ${coverage.measured} of ${coverage.core}.`,
    `Verdict: ${output.verdict}`,
    "",
    "Move first:",
    ...bullets(output.moveFirst.map(({ markerKey, reason }) => `${markerKey}: ${reason}`)),
    "",
    "Follow-ups:",
    ...bullets(
      output.followUps
        .filter((followUp) => followUp.kind !== "measure")
        .map(({ kind, markerKey, title }) => `${markerKey}: ${title} (${kind})`),
    ),
    "",
    `Not measured: ${output.unmeasured.map((item) => item.name).join(", ") || "none"}.`,
    "",
    "Report key list. Cite only these keys.",
    "Patterns (key | name | status | what it suggests | what to do | markers):",
    ...output.patterns.map(
      ({ key, name, severity, whatItSuggests, whatToDo, matched }) =>
        `${key} | ${name} | ${severity} | ${whatItSuggests} | ${whatToDo} | ${matched.map((condition) => condition.markerKey).join(", ")}`,
    ),
    "Markers (key | name | value | status | optimal range):",
    ...results.map(
      (result) =>
        `${result.markerKey} | ${names.get(result.markerKey)} | ${result.value} ${result.unit} | ${result.status === "unknown" ? "no status" : result.status} | ${range(result.calibrated?.optimalLow, result.calibrated?.optimalHigh)}`,
    ),
  ];
  return lines.join("\n");
}

/** Lists the failed sentences with their problems, numbered in the order the replacements must come back. */
function fixRequest(sentences: DraftSentence[], failed: number[], problems: NarrativeProblem[]) {
  const items = failed.map((index, n) => {
    const sentence = sentences[index]!;
    const reasons = problems.filter((problem) => problem.index === index);
    return `${n + 1}. [${sentence.section}] "${sentence.text}" cites {${sentence.citedKeys.join(", ")}}. ${reasons.map(({ message }) => message).join(" ")}`;
  });
  return `We rejected these sentences of your narrative. Write a new version of each one that keeps its meaning and passes every rule.
${items.join("\n")}
Call write_narrative with exactly ${failed.length} sentences, one for each, in this order.`;
}

/**
 * Asks Claude for the report narrative from the engine output only, and returns it once it passes validation.
 *
 * @remarks
 * A rejected draft gets one more call. When only some sentences fail, that call sends back those sentences alone and
 * the new versions replace them. A second rejection returns null, and the report shows engine text alone.
 */
export async function writeNarrative(
  output: EngineOutput,
  profile: EngineProfile,
  usage: NarrativeUsage,
): Promise<Narrative | null> {
  const allowed = new Set([
    ...[...output.markers, ...output.derived].map((result) => result.markerKey),
    ...output.patterns.map((match) => match.key),
  ]);
  if (allowed.size === 0) return null;
  const tool = narrativeTool([...allowed]);
  const facts: Anthropic.TextBlockParam = {
    type: "text",
    text: reportFacts(output, profile),
    cache_control: { type: "ephemeral" },
  };
  const ask = "Write the narrative for this report with the write_narrative tool.";
  const reject = (problems: NarrativeProblem[]) => {
    usage.rejections = [...(usage.rejections ?? []), ...problems.map(({ rule }) => rule)];
  };
  const draft = async (text: string): Promise<DraftSentence[] | NarrativeProblem> => {
    const input = await callTool(tool, system, [facts, { type: "text", text }], usage);
    const parsed = draftSchema.safeParse(input);
    if (parsed.success) return parsed.data.sentences;
    const message =
      input === undefined ? "No write_narrative call was made." : z.prettifyError(parsed.error);
    return { rule: "invalid_call", message };
  };

  const first = await draft(ask);
  const problems = Array.isArray(first) ? validateNarrative(first, allowed) : [first];
  if (Array.isArray(first) && problems.length === 0) return toNarrative(first);
  reject(problems);

  let next: DraftSentence[] | NarrativeProblem;
  if (!Array.isArray(first) || problems.some(({ index }) => index === undefined)) {
    const reasons = problems.map(({ message, index }) =>
      Array.isArray(first) && index !== undefined ? `"${first[index]!.text}" ${message}` : message,
    );
    next = await draft(
      `${ask}\n\nWe rejected your previous write_narrative call:\n${reasons.map((reason) => `- ${reason}`).join("\n")}\nCall it again and fix every problem.`,
    );
  } else {
    const indexes = [...new Set(problems.map(({ index }) => index!))];
    const fixes = await draft(fixRequest(first, indexes, problems));
    next =
      Array.isArray(fixes) && fixes.length !== indexes.length
        ? { rule: "invalid_call", message: "The fix count did not match the rejected sentences." }
        : Array.isArray(fixes)
          ? first.map((sentence, index) => {
              const fix = fixes[indexes.indexOf(index)];
              return fix ? { ...fix, section: sentence.section } : sentence;
            })
          : fixes;
  }
  const nextProblems = Array.isArray(next) ? validateNarrative(next, allowed) : [next];
  if (Array.isArray(next) && nextProblems.length === 0) return toNarrative(next);
  reject(nextProblems);
  return null;
}

/**
 * Puts an engine sentence first under "The headline", or returns the narrative as it is when there is none.
 *
 * @remarks
 * A study alert must reach the headline on every read, so the engine writes that sentence and Claude never sees it.
 */
export function withHeadline(narrative: Narrative, sentence: string | undefined): Narrative {
  if (!sentence) return narrative;
  return {
    sections: narrative.sections.map((section) =>
      section.heading === "The headline"
        ? { ...section, sentences: [{ text: sentence, markerKeys: [] }, ...section.sentences] }
        : section,
    ),
  };
}
