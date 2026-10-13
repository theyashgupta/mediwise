import type Anthropic from "@anthropic-ai/sdk";
import { derived, type FindingDraft, markers, studyMarkers, type Visit } from "@mediwise/engine";
import { z } from "zod";
import { callTool, type StepUsage } from "../extraction/index.js";

const maxWords = 20;
const maxSentences = 3;
const diagnosisWords = /\byou have\b|\bdiagnos|\bdisease\b/i;
const catalogNames = [...markers, ...derived, ...studyMarkers].flatMap((entry) =>
  [entry.name, entry.shortName ?? ""]
    .filter((name) => name.length >= 3)
    .map((name) => ({ key: entry.key, name: name.toLowerCase() })),
);

/** Tells whether a lower-case text names a marker as a whole word. */
function namedIn(text: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`).test(text);
}

const bodiesSchema = z.object({
  findings: z.array(
    z.object({
      number: z.number().int().describe("The number of the finding in the user message"),
      body: z.string().trim().min(1).describe("1 to 3 sentences of 20 words or fewer each"),
      citedKeys: z
        .array(z.string())
        .describe("Keys from the cite list of this finding that the body uses"),
    }),
  ),
});
type Body = z.infer<typeof bodiesSchema>["findings"][number];

const tool: Anthropic.Tool = {
  name: "write_findings",
  description: "Records the plain-English body of each numbered finding, with the keys it cites.",
  input_schema: z.toJSONSchema(bodiesSchema) as Anthropic.Tool.InputSchema,
};

export const findingExamples = [
  {
    number: 1,
    body: "TSH was 5.41 µIU/mL in Jan 2024 and is 9.98 µIU/mL now. It moves away from the optimal range.",
    citedKeys: ["tsh"],
  },
  {
    number: 2,
    body: "The ultrasound shows grade I fatty liver. Your triglycerides and HbA1c are optimal. Ask your doctor which tests to repeat.",
    citedKeys: ["study_1", "triglycerides", "hba1c"],
  },
  {
    number: 3,
    body: "Vitamin D rose from 11.13 to 23.4 ng/mL. It moved from risk status to watch status.",
    citedKeys: ["vitamin_d"],
  },
];

const system = `You explain the findings of one lab report to an adult in plain English. The user message gives numbered findings. Each finding has a title, a cite list and facts. Call the write_findings tool once, with one body for each finding.

Form rules:
1. Write 1 to ${maxSentences} sentences for each body. Each sentence has ${maxWords} words or fewer. Aim for 12 words.
2. Do not use a semicolon. Use active voice. Do not use a phrasal verb.
3. Do not repeat the title word for word. Give the reader what the title does not say.
4. Copy each key in citedKeys exactly from the cite list of the same finding. Cite one key or more. Cite each marker and study that the body names.
5. Name only the markers that the finding's facts name. Call each marker by the name in the facts.

Content rules:
6. Say what the facts say and nothing more. Do not add a cause, a diagnosis or a fact that is not in the facts.
7. Keep every hedge. "May be low" stays "may be low". Never make a hedge into a fact.
8. Do not use diagnosis words. Do not write "you have", "diagnosed" or "disease".
9. Do not name a drug. Do not give a supplement dose.
10. Use the status names optimal, watch and risk. Use the direction words improving, worsening and stable as the facts give them.
11. Do not write about the lab or the test method. MediWise adds that note itself.

Three bodies that pass every rule, as write_findings input:
${JSON.stringify({ findings: findingExamples })}`;

export type FindingRule =
  | "invalid_call"
  | "missing"
  | "long_sentence"
  | "too_many_sentences"
  | "semicolon"
  | "diagnosis_word"
  | "uncited"
  | "unknown_key"
  | "unknown_marker";
export type FindingProblem = { rule: FindingRule; message: string };
export type FindingsUsage = StepUsage & { rejections?: FindingRule[]; dropped?: number };
export type Finding = Omit<FindingDraft, "facts" | "note" | "askDoctor" | "direction"> & {
  body: string;
};

/**
 * Lists every reason one body breaks the copy rules, cites nothing, or names a marker that is not in either visit.
 *
 * @remarks
 * Present names are cut out of the text before the search, so "fasting glucose" never counts as a bare "glucose".
 */
export function validateFindingBody(
  { body, citedKeys }: Pick<Body, "body" | "citedKeys">,
  allowed: Set<string>,
): FindingProblem[] {
  const problems: FindingProblem[] = [];
  const sentences = body.split(/(?<=[.!?])\s+/);
  if (sentences.length > maxSentences) {
    problems.push({
      rule: "too_many_sentences",
      message: `Write ${maxSentences} sentences or fewer. You wrote ${sentences.length}.`,
    });
  }
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (words > maxWords) {
      problems.push({
        rule: "long_sentence",
        message: `"${sentence}" has ${words} words. Use ${maxWords} or fewer.`,
      });
    }
  }
  if (body.includes(";")) problems.push({ rule: "semicolon", message: "It has a semicolon." });
  if (diagnosisWords.test(body)) {
    problems.push({ rule: "diagnosis_word", message: "It uses a diagnosis word." });
  }
  if (citedKeys.length === 0) problems.push({ rule: "uncited", message: "It cites no key." });
  for (const key of citedKeys.filter((key) => !allowed.has(key))) {
    problems.push({
      rule: "unknown_key",
      message: `It cites "${key}", which is not in the cite list.`,
    });
  }
  const names = catalogNames.toSorted((a, b) => b.name.length - a.name.length);
  let text = body.toLowerCase();
  for (const { name } of names.filter(({ key }) => allowed.has(key))) {
    text = text.replaceAll(name, " ");
  }
  const absent = new Set(
    names
      .filter(({ key, name }) => !allowed.has(key) && namedIn(text, name))
      .map(({ name }) => name),
  );
  for (const name of absent) {
    problems.push({
      rule: "unknown_marker",
      message: `It names "${name}", which is not in this report.`,
    });
  }
  return problems;
}

/**
 * Writes the findings as numbered blocks, with study ids swapped for short references Claude can copy.
 */
function findingFacts(drafts: FindingDraft[], studyRefs: Map<string, string>) {
  return drafts
    .map((draft, index) => {
      const cite = [...draft.citedKeys, ...draft.citedStudyIds.map((id) => studyRefs.get(id))];
      return [
        `Finding ${index + 1}: ${draft.title}`,
        `Kind: ${draft.kind}. Severity: ${draft.severity}.`,
        `Cite list: ${cite.join(", ")}`,
        ...draft.facts.map((fact) => `- ${fact}`),
      ].join("\n");
    })
    .join("\n\n");
}

/**
 * Asks Claude for the body of each finding and keeps the findings whose body passes validation.
 *
 * @remarks
 * Title, cited keys and rank come from the engine, so the same visits give the same set of findings.
 * A rejected body gets one more call with the reasons. A body that fails twice drops its finding, unless the engine
 * gave a fallback body, as it does for a study alert.
 * A body may cite and name any marker of the visits given.
 */
export async function writeFindings(
  drafts: FindingDraft[],
  visits: (Visit | undefined)[],
  usage: FindingsUsage,
): Promise<Finding[]> {
  if (drafts.length === 0) return [];
  const allowedKeys = visits.flatMap((visit) => [
    ...(visit?.markers.map(({ markerKey }) => markerKey) ?? []),
    ...(visit?.studies.flatMap(({ measurements }) => measurements.map(({ key }) => key)) ?? []),
  ]);
  const studyIds = [...new Set(drafts.flatMap(({ citedStudyIds }) => citedStudyIds))];
  const studyRefs = new Map(studyIds.map((id, index) => [id, `study_${index + 1}`]));
  const allowed = new Set([...allowedKeys, ...studyRefs.values()]);
  const facts: Anthropic.TextBlockParam = {
    type: "text",
    text: findingFacts(drafts, studyRefs),
    cache_control: { type: "ephemeral" },
  };
  const reject = (rules: FindingRule[]) => {
    if (rules.length > 0) usage.rejections = [...(usage.rejections ?? []), ...rules];
  };
  const ask = async (text: string) => {
    const input = await callTool(tool, system, [facts, { type: "text", text }], usage);
    const parsed = bodiesSchema.safeParse(input);
    if (parsed.success) return parsed.data.findings;
    reject(["invalid_call"]);
    return [];
  };
  const check = (bodies: Body[], numbers: number[]) =>
    numbers.map((number) => {
      const body = bodies.find((item) => item.number === number);
      const problems: FindingProblem[] = body
        ? validateFindingBody(body, allowed)
        : [{ rule: "missing", message: "You wrote no body for it." }];
      return { number, body, problems };
    });

  const all = drafts.map((_, index) => index + 1);
  const first = check(
    await ask("Write the body of every finding with the write_findings tool."),
    all,
  );
  const failed = first.filter(({ problems }) => problems.length > 0);
  reject(failed.flatMap(({ problems }) => problems.map(({ rule }) => rule)));
  const second =
    failed.length === 0
      ? []
      : check(
          await ask(
            `We rejected these bodies. Write a new body for each one that passes every rule.\n${failed
              .map(
                ({ number, body, problems }) =>
                  `${number}. ${body ? `"${body.body}" ` : ""}${problems.map(({ message }) => message).join(" ")}`,
              )
              .join(
                "\n",
              )}\nCall write_findings with only these findings: ${failed.map(({ number }) => number).join(", ")}.`,
          ),
          failed.map(({ number }) => number),
        );
  reject(second.flatMap(({ problems }) => problems.map(({ rule }) => rule)));
  const passed = new Map(
    [...first, ...second].flatMap(({ number, body, problems }) =>
      body && problems.length === 0 ? [[number, body.body] as const] : [],
    ),
  );
  usage.dropped = drafts.length - passed.size;
  return drafts.flatMap((draft, index) => {
    const body = passed.get(index + 1) ?? draft.fallback;
    return body ? [toFinding(draft, body)] : [];
  });
}

function toFinding(draft: FindingDraft, body: string): Finding {
  const { kind, severity, title, citedKeys, citedStudyIds, rank, note } = draft;
  return {
    kind,
    severity,
    title,
    citedKeys,
    citedStudyIds,
    rank,
    body: note ? `${body} ${note}` : body,
  };
}

/** Keeps the findings that have an engine fallback body, for a read where the Claude call threw. */
export function fallbackFindings(drafts: FindingDraft[]): Finding[] {
  return drafts.flatMap((draft) => (draft.fallback ? [toFinding(draft, draft.fallback)] : []));
}
