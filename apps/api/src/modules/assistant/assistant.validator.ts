import { z } from "zod";
import { absentMarkerNames, statesSettledAsCurrent } from "../findings/index.js";
import type { AssistantContext, ContextRef } from "./assistant.context.js";

export const modelRefusalKinds = [
  "diagnosis",
  "treatment",
  "worry",
  "prediction",
  "not_in_data",
  "other_person",
  "off_topic",
] as const;

export const answerInputSchema = z.object({
  kind: z.enum(["answer", "refuse"]).describe("answer, or refuse with a refuseKind"),
  refuseKind: z
    .enum(modelRefusalKinds)
    .nullish()
    .describe("Set only when kind is refuse. MediWise shows its own fixed text for it."),
  sentences: z
    .array(
      z.object({
        text: z.string().trim().min(1).describe("One sentence of 20 words or fewer"),
        cites: z
          .array(z.string())
          .describe("References from the data block that the sentence uses"),
      }),
    )
    .describe(
      "1 to 5 sentences. Empty for a refusal, except a worry or treatment refusal with facts",
    ),
});
export type AnswerInput = z.infer<typeof answerInputSchema>;

export type AnswerRule =
  | "invalid_call"
  | "too_many_sentences"
  | "long_sentence"
  | "semicolon"
  | "uncited_number"
  | "unknown_ref"
  | "number_not_in_fact"
  | "wrong_date"
  | "unknown_marker"
  | "diagnosis_word"
  | "treatment_word"
  | "status_word"
  | "certainty_word"
  | "cause_word"
  | "settled_as_current"
  | "paraphrased_study";
export type AnswerProblem = { rule: AnswerRule; message: string };

const maxSentences = 5;
const maxWords = 20;
const refusalsWithFacts = new Set(["worry", "treatment"]);
const monthNames = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const month = String.raw`(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?`;
const fullDate = new RegExp(String.raw`\b(\d{1,2}) ${month},? (\d{4})\b`, "gi");
const monthYear = new RegExp(String.raw`\b${month},? (\d{4})\b`, "gi");
const isoDate = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const bareYear = /\b(19|20)\d{2}\b/g;
const diagnosisWords =
  /\byou have\b|\bdiagnos|\bdisease|\bdisorder|\bsyndrome|\bcancer|\btumou?r|\bmalignan|\bdiabetic|\bdiabetes|\bprediabetes|\bhypothyroid|\bhyperthyroid|\banaemi|\banemi|\bdeficien|\bfailure\b|\binfection/i;
const treatmentWords =
  /\bdos(e|es|age)\b|\bmg of\b|\btablets?\b|\bcapsules?\b|\btake\b|\btaking\b|\bprescri\w*|\bmedicines?\b|\bmedications?\b|\binsulin\b|\bstatins?\b|\bmetformin\b|\blevothyroxine\b|\bsupplements?\b|\binjections?\b/gi;
const statusWords = /\b(normal|abnormal|fine|healthy|safe|dangerous|good|bad)\b/i;
const certaintyWords =
  /\b(definitely|certainly|clearly|confirms?|confirmed|proves?|proven)\b|\bnothing to worry about\b/i;
const hedgeWords = /\b(may|might|can|could|suggests?|possible|possibly)\b/i;
const causeWords = /\bbecause\b|\bdue to\b|\bcaused by\b|\bthe reason\b/gi;
const quotePattern = /"([^"]+)"|“([^”]+)”/g;
const genericWords = new Set(
  "about also and are ask asks been both doctor dated earlier explain findings from have impression into later line lines more printed read reads report reports result says scan settle settled settles show shown shows study test that the their there this what when which with your".split(
    " ",
  ),
);

function normal(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")
    .trim();
}

function words(text: string) {
  return text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
}

function numbersIn(text: string) {
  return (text.replace(/(\d),(?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

function iso(year: string, monthIndex: number, dayOfMonth: string) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${dayOfMonth.padStart(2, "0")}`;
}

/**
 * Finds the dates a sentence states and takes them out of the text.
 *
 * @remarks
 * A day with month and year must be a cited date. A month with a year, or a bare year, must hold a cited date.
 */
function takeDates(text: string) {
  const days: string[] = [];
  const months: string[] = [];
  const years: string[] = [];
  let rest = text.replace(fullDate, (_, dayOfMonth: string, name: string, year: string) => {
    days.push(iso(year, monthNames.indexOf(name.slice(0, 3).toLowerCase()), dayOfMonth));
    return " ";
  });
  rest = rest.replace(isoDate, (match) => {
    days.push(match);
    return " ";
  });
  rest = rest.replace(monthYear, (_, name: string, year: string) => {
    months.push(iso(year, monthNames.indexOf(name.slice(0, 3).toLowerCase()), "1").slice(0, 7));
    return " ";
  });
  rest = rest.replace(bareYear, (year) => {
    years.push(year);
    return " ";
  });
  return { rest, days, months, years };
}

/**
 * Splits one text into sentences, with each quoted part held as one token.
 *
 * @remarks
 * A printed study line can hold full stops and many words. The copy rules govern MediWise's own words, so a quote counts
 * as one word and never ends a sentence.
 */
function splitSentences(text: string) {
  const quotes: string[] = [];
  const held = text.replace(quotePattern, (match) => {
    quotes.push(match);
    return `⟦${quotes.length - 1}⟧`;
  });
  return held
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((part) => ({
      wordCount: part.split(/\s+/).filter(Boolean).length,
      text: part.replace(/⟦(\d+)⟧/g, (_, index: string) => quotes[Number(index)]!),
    }));
}

/** Lists the sentences a user sees: every sentence of an answer, the facts of a worry or treatment refusal, else none. */
export function shownSentences(input: AnswerInput) {
  if (input.kind === "answer") return input.sentences;
  return input.refuseKind && refusalsWithFacts.has(input.refuseKind) ? input.sentences : [];
}

/**
 * Checks one sentence against the facts it cites.
 *
 * @remarks
 * Word lists run on the text outside quotes that match a cited printed line, so a quoted impression keeps its words.
 * A cited pattern name, a cited follow-up title, and words of cited catalog or follow-up text are the listed exceptions.
 */
function checkSentence(
  text: string,
  cited: ContextRef[],
  presentKeys: Set<string>,
  context: Pick<AssistantContext, "settled">,
): AnswerProblem[] {
  const problems: AnswerProblem[] = [];
  const add = (rule: AnswerRule, message: string) => problems.push({ rule, message });
  const printed = cited.flatMap(({ quotes }) => quotes ?? []).map(normal);
  const allowedText = cited
    .map(({ text: own }) => own ?? "")
    .join(" ")
    .toLowerCase();
  const quotes = [...text.matchAll(quotePattern)].map((match) => match[1] ?? match[2] ?? "");
  const badQuotes = quotes.filter(
    (quote) =>
      !printed.some((line) => line.includes(normal(quote)) || normal(quote).includes(line)),
  );
  let bare = text.replace(quotePattern, (match, a?: string, b?: string) =>
    badQuotes.includes(a ?? b ?? "") ? match : " ",
  );

  if (bare.includes(";")) add("semicolon", `"${text}" has a semicolon.`);
  if (/\d/.test(text) && cited.length === 0) {
    add("uncited_number", `"${text}" states a number and cites no reference.`);
  }

  const dates = takeDates(bare);
  const citedDates = cited.flatMap(({ dates: own }) => own);
  for (const date of dates.days.filter((date) => !citedDates.includes(date))) {
    add("wrong_date", `"${text}" states ${date}, which is not a date of a cited reference.`);
  }
  for (const yearMonth of dates.months.filter((ym) => !citedDates.some((d) => d.startsWith(ym)))) {
    add("wrong_date", `"${text}" states ${yearMonth}, which holds no date of a cited reference.`);
  }
  for (const year of dates.years.filter((y) => !citedDates.some((d) => d.startsWith(y)))) {
    add("wrong_date", `"${text}" states ${year}, which holds no date of a cited reference.`);
  }
  const allowedNumbers = new Set(cited.flatMap(({ fact }) => numbersIn(fact)));
  for (const value of numbersIn(dates.rest).filter((value) => !allowedNumbers.has(value))) {
    add(
      "number_not_in_fact",
      `"${text}" states ${value}, which is not in the cited facts. State only numbers from the data block.`,
    );
  }

  for (const name of absentMarkerNames(bare, presentKeys)) {
    add("unknown_marker", `"${text}" names ${name}, which is not in these reports.`);
  }

  for (const name of cited
    .filter(({ cite }) => cite.kind === "pattern")
    .flatMap(({ names }) => names ?? [])) {
    bare = bare.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  }
  if (diagnosisWords.test(bare)) {
    add("diagnosis_word", `"${text}" uses a diagnosis word. Name a pattern only when you cite it.`);
  }

  let withoutTitles = bare;
  for (const title of cited
    .filter(({ cite }) => cite.kind === "follow_up")
    .flatMap(({ names }) => names ?? [])) {
    withoutTitles = withoutTitles.replace(
      new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      " ",
    );
  }
  const treatment = [...withoutTitles.matchAll(treatmentWords)]
    .map(([word]) => word.toLowerCase())
    .filter((word) => !new RegExp(`\\b${word}\\b`).test(allowedText));
  if (treatment.length > 0) {
    add(
      "treatment_word",
      `"${text}" uses "${treatment[0]}". Do not write about a medicine or a dose.`,
    );
  }

  const status = statusWords.exec(bare)?.[1];
  if (status) {
    add("status_word", `"${text}" uses "${status}". Use the status names optimal, watch and risk.`);
  }
  const certainty = certaintyWords.exec(bare)?.[0];
  if (certainty) add("certainty_word", `"${text}" uses "${certainty}". Keep every hedge.`);
  const hedged = cited.some(
    ({ cite, text: own }) => cite.kind === "pattern" && hedgeWords.test(own ?? ""),
  );
  if (hedged && !hedgeWords.test(bare)) {
    add(
      "certainty_word",
      `"${text}" drops the hedge of the cited pattern. Keep "may" or "suggests".`,
    );
  }
  const cause = [...bare.matchAll(causeWords)]
    .map(([phrase]) => phrase.toLowerCase())
    .filter((phrase) => !allowedText.includes(phrase));
  if (cause.length > 0) {
    add("cause_word", `"${text}" uses "${cause[0]}". Do not state a cause.`);
  }

  if (
    statesSettledAsCurrent(
      text,
      context.settled.filter(({ markerKey }) => !markerKey),
    )
  ) {
    add(
      "settled_as_current",
      `"${text}" states a settled result as current. Say that the later report settles it.`,
    );
  }

  const studies = cited.filter(({ quotes: own }) => (own ?? []).length > 0);
  if (studies.length > 0) {
    const allowedWords = new Set([
      ...genericWords,
      ...studies.flatMap(({ names }) => words((names ?? []).join(" "))),
    ]);
    const printedWords = new Set(printed.flatMap(words));
    const paraphrase = words(bare).filter(
      (word) => printedWords.has(word) && !allowedWords.has(word),
    );
    if (badQuotes.length > 0 || paraphrase.length > 0) {
      add(
        "paraphrased_study",
        `"${text}" retells a printed study line. Quote the line exactly in quotes, or name only the kind, region and date.`,
      );
    }
  }
  return problems;
}

/**
 * Lists every reason an answer breaks the copy rules or states something the cited facts do not hold.
 *
 * @remarks
 * Only the sentences a user sees are checked. Only settled study alerts count for `settled_as_current`, because a
 * value with its date stays a true fact after a later report settles it.
 */
export function validateAnswer(
  raw: unknown,
  context: Pick<AssistantContext, "refs" | "settled">,
): { input?: AnswerInput; problems: AnswerProblem[] } {
  const parsed = answerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      problems: [{ rule: "invalid_call", message: "The tool input does not match the schema." }],
    };
  }
  const input = parsed.data;
  if (input.kind === "refuse" && !input.refuseKind) {
    return {
      input,
      problems: [{ rule: "invalid_call", message: "A refusal needs a refuseKind." }],
    };
  }
  if (input.kind === "answer" && input.sentences.length === 0) {
    return {
      input,
      problems: [{ rule: "invalid_call", message: "An answer needs 1 sentence or more." }],
    };
  }

  const problems: AnswerProblem[] = [];
  const presentKeys = new Set(
    [...context.refs.values()].flatMap(({ cite, keys }) => [
      ...(cite.kind === "value" || cite.kind === "catalog" ? [cite.target ?? ""] : []),
      ...(keys ?? []),
    ]),
  );
  const shown = shownSentences(input);
  const pieces = shown.flatMap(({ text, cites }) =>
    splitSentences(text).map((piece) => ({ ...piece, cites })),
  );
  if (pieces.length > maxSentences) {
    problems.push({
      rule: "too_many_sentences",
      message: `Write ${maxSentences} sentences or fewer. You wrote ${pieces.length}.`,
    });
  }
  for (const { cites } of shown) {
    for (const ref of cites.filter((ref) => !context.refs.has(ref))) {
      problems.push({
        rule: "unknown_ref",
        message: `"${ref}" is not a reference in the data block.`,
      });
    }
  }
  for (const { text, wordCount, cites } of pieces) {
    if (wordCount > maxWords) {
      problems.push({
        rule: "long_sentence",
        message: `"${text}" has ${wordCount} words. Use ${maxWords} or fewer.`,
      });
    }
    const cited = cites.flatMap((ref) => context.refs.get(ref) ?? []);
    problems.push(...checkSentence(text, cited, presentKeys, context));
  }
  return { input, problems };
}
