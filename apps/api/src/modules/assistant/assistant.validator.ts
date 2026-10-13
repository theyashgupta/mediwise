import { assistantRefusalKinds } from "@mediwise/shared";
import { z } from "zod";
import { absentMarkerNames, statesSettledAsCurrent } from "../findings/index.js";
import type { AssistantContext, ContextRef } from "./assistant.context.js";

export const answerInputSchema = z.object({
  kind: z.enum(["answer", "refuse"]).describe("answer, or refuse with a refuseKind"),
  refuseKind: z
    .enum(assistantRefusalKinds)
    .exclude(["fallback"])
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
  | "uncited"
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

type DatePart = { year?: string; month?: number; day?: number };

const maxSentences = 5;
const maxWords = 20;
const refusalsWithFacts = new Set(["worry", "treatment"]);
const fixedLines = new Set([
  "ask your doctor to explain it",
  "ask your doctor before you book a retest",
  "the report page shows the rest",
]);
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
const ordinal = String.raw`(\d{1,2})(?:st|nd|rd|th)?`;
const dayMonth = new RegExp(String.raw`\b${ordinal}\s+(?:of\s+)?${month}(?:,?\s+(\d{4}))?\b`, "gi");
const monthDay = new RegExp(String.raw`\b${month}\s+${ordinal}(?:,?\s+(\d{4}))?\b`, "gi");
const monthYear = new RegExp(String.raw`\b${month},?\s+(\d{4})\b`, "gi");
const isoDate = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const bareMonth =
  /\b(January|February|March|April|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\b/g;
const yearAfterWord =
  /\b(?:in|of|since|from|until|till|to|during|by|before|after|year)\s+((?:19|20)\d{2})\b/gi;
const numberToken = /(?<![\w.])[+-]?\d+(?:\.\d+)?/g;
const refToken = /\b(?:R\d+(?::S\d+|:[a-z0-9_]+)?|[FLE]\d+|[PUC]:[a-z0-9_]+)\b/g;
const quotePattern = /["“]([^"“”]+)["”]/g;
const diagnosisWords =
  /\byou (?:may |might |could |probably |likely |possibly )?have\b|\bdiagnos(?!tics?\b)|\bdisease|\bdisorder|\bsyndrome|\bcancer|\btumou?r|\bmalignan|\bdiabetic|\bdiabetes|\bprediabetes|\bhypothyroid|\bhyperthyroid|\banaemi|\banemi|\bdeficien|\bfailure\b|\binfection|\bhypertension\b|\bpcos\b|\bpolycystic\b|\bcirrhosis\b/i;
const treatmentWords =
  /\bdos(e|es|age)\b|\bmg of\b|\btablets?\b|\bcapsules?\b|\bpills?\b|\btake\b|\btaking\b|\bprescri\w*|\bmedicines?\b|\bmedications?\b|\bdrugs?\b|\binsulin\b|\b\w*statins?\b|\bmetformin\b|\blevothyroxine\b|\baspirin\b|\bantibiotics?\b|\bsupplements?\b|\binjections?\b/gi;
const statusWords =
  /\b(normal|abnormal|fine|healthy|safe|dangerous|good|bad|serious|urgent|urgently|alarming|worrying)\b/i;
const certaintyWords =
  /\b(definitely|certainly|clearly|confirms?|confirmed|proves?|proven)\b|\bnothing to worry about\b/i;
const hedgeWords = /\b(may|might|can|could|suggests?|possible|possibly)\b/i;
const causeWords = /\bbecause\b|\bdue to\b|\bcaused by\b|\bthe reason\b/gi;
const genericWords = new Set(
  "about also and are ask asks been both doctor dated earlier explain findings from have impression into later line lines more printed read reads report reports result says scan settle settled settles show shown shows study test that the their there this what when which with your".split(
    " ",
  ),
);

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")
    .trim();
}

function longWords(text: string) {
  return text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
}

function sentencesOf(text: string) {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map(normalize)
    .filter(Boolean);
}

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function monthIndex(name: string) {
  return monthNames.indexOf(name.slice(0, 3).toLowerCase()) + 1;
}

/**
 * Finds every date a sentence states, in any common form, and takes it out of the text.
 *
 * @remarks
 * A bare month counts only when capitalised, and never "May", which is also a hedge word. A bare year counts after a
 * word such as "in" or "since", so a value such as 2000 pg/mL stays a number.
 */
function takeDates(text: string) {
  const parts: DatePart[] = [];
  let rest = text.replace(isoDate, (_, year: string, monthText: string, dayText: string) => {
    parts.push({ year, month: Number(monthText), day: Number(dayText) });
    return " ";
  });
  rest = rest.replace(dayMonth, (_, dayText: string, name: string, year?: string) => {
    parts.push({ year, month: monthIndex(name), day: Number(dayText) });
    return " ";
  });
  rest = rest.replace(monthDay, (_, name: string, dayText: string, year?: string) => {
    parts.push({ year, month: monthIndex(name), day: Number(dayText) });
    return " ";
  });
  rest = rest.replace(monthYear, (_, name: string, year: string) => {
    parts.push({ year, month: monthIndex(name) });
    return " ";
  });
  rest = rest.replace(bareMonth, (name: string) => {
    parts.push({ month: monthIndex(name) });
    return " ";
  });
  rest = rest.replace(yearAfterWord, (match: string, year: string) => {
    parts.push({ year });
    return match.replace(year, " ");
  });
  return { rest, parts };
}

function matchesDate({ year, month: monthNumber, day }: DatePart, iso: string) {
  const [y, m, d] = iso.split("-");
  return (
    (year === undefined || y === year) &&
    (monthNumber === undefined || Number(m) === monthNumber) &&
    (day === undefined || Number(d) === day)
  );
}

function describeDate({ year, month: monthNumber, day }: DatePart) {
  return [day, monthNumber ? monthNames[monthNumber - 1] : undefined, year]
    .filter(Boolean)
    .join(" ");
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
 * Word lists run on the text outside valid quotes. A quote is valid only when it holds whole printed sentences of a
 * cited study, so a cut such as "malignancy" from "No evidence of malignancy" stays under every word list.
 */
function checkSentence(
  text: string,
  cited: ContextRef[],
  presentKeys: Set<string>,
  context: Pick<AssistantContext, "refs" | "settled">,
): AnswerProblem[] {
  const problems: AnswerProblem[] = [];
  const add = (rule: AnswerRule, message: string) => problems.push({ rule, message });
  const textOf = (kinds: string[]) =>
    cited
      .filter(({ cite }) => kinds.includes(cite.kind))
      .map(({ text: own }) => own ?? "")
      .join(" ")
      .toLowerCase();
  const printed = cited.flatMap(({ quotes }) => quotes ?? []);
  const printedSentences = new Set(printed.flatMap(sentencesOf));
  const quotes = [...text.matchAll(quotePattern)].map((match) => match[1] ?? "");
  const badQuotes = quotes.filter((quote) => {
    const own = sentencesOf(quote);
    return own.length === 0 || own.some((sentence) => !printedSentences.has(sentence));
  });
  let bare = text.replace(quotePattern, (match, quote: string) =>
    badQuotes.includes(quote) ? match : " ",
  );

  if (cited.length === 0 && !fixedLines.has(normalize(text))) {
    add("uncited", `"${text}" cites no reference. Cite the facts of every sentence.`);
  }
  if (bare.includes(";")) add("semicolon", `"${text}" has a semicolon.`);
  if ([...bare.matchAll(refToken)].some(([token]) => context.refs.has(token))) {
    add(
      "unknown_ref",
      `"${text}" writes a reference in the text. Put references in cites only, and name the report by its date.`,
    );
  }
  if (/\d/.test(text) && cited.length === 0) {
    add("uncited_number", `"${text}" states a number and cites no reference.`);
  }

  const { rest, parts } = takeDates(bare);
  const citedDates = cited.flatMap(({ dates }) => dates);
  for (const part of parts.filter((part) => !citedDates.some((date) => matchesDate(part, date)))) {
    add(
      "wrong_date",
      `"${text}" states ${describeDate(part)}, which is not a date of a cited reference.`,
    );
  }
  const allowed = cited.flatMap(({ numbers }) => numbers);
  for (const token of rest.match(numberToken) ?? []) {
    const value = Number(token);
    const known = /^[+-]/.test(token)
      ? allowed.includes(value)
      : allowed.some((number) => Math.abs(number) === Math.abs(value));
    if (!known) {
      add(
        "number_not_in_fact",
        `"${text}" states ${token}, which is not in the cited facts. State only numbers from the data block.`,
      );
    }
  }

  for (const name of absentMarkerNames(bare, presentKeys)) {
    add("unknown_marker", `"${text}" names ${name}, which is not in these reports.`);
  }

  const strip = (from: string, kind: string) =>
    cited
      .filter(({ cite }) => cite.kind === kind)
      .flatMap(({ names }) => names ?? [])
      .reduce((result, name) => result.replace(new RegExp(escape(name), "gi"), " "), from);
  bare = strip(bare, "pattern");
  if (diagnosisWords.test(bare)) {
    add("diagnosis_word", `"${text}" uses a diagnosis word. Name a pattern only when you cite it.`);
  }

  const treatmentText = textOf(["follow_up", "catalog"]);
  const treatment = [...strip(bare, "follow_up").matchAll(treatmentWords)]
    .map(([word]) => word.toLowerCase())
    .filter((word) => !new RegExp(`\\b${escape(word)}\\b`).test(treatmentText));
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
  if (hedgeWords.test(textOf(["pattern"])) && !hedgeWords.test(bare)) {
    add(
      "certainty_word",
      `"${text}" drops the hedge of the cited pattern. Keep "may" or "suggests".`,
    );
  }
  const causeText = textOf(["catalog", "pattern"]);
  const cause = [...bare.matchAll(causeWords)]
    .map(([phrase]) => phrase.toLowerCase())
    .filter((phrase) => !causeText.includes(phrase));
  if (cause.length > 0) {
    add("cause_word", `"${text}" uses "${cause[0]}". Do not state a cause.`);
  }

  if (/\bsettle/i.test(bare) && !cited.some(({ settlement }) => settlement)) {
    add(
      "settled_as_current",
      `"${text}" says that a report settles a result, but cites no settled result. Use "settles" only with its L reference.`,
    );
  }
  const open = context.settled.filter(
    (settlement) => !settlement.markerKey && !cited.some((ref) => ref.settlement === settlement),
  );
  if (statesSettledAsCurrent(text, open)) {
    add(
      "settled_as_current",
      `"${text}" states a settled result as current. Say that the later report settles it.`,
    );
  }

  const studies = cited.filter(({ quotes: own }) => (own ?? []).length > 0);
  if (studies.length > 0) {
    const allowedWords = new Set([
      ...genericWords,
      ...studies.flatMap(({ names }) => longWords((names ?? []).join(" "))),
    ]);
    const printedWords = new Set(printed.flatMap(longWords));
    const paraphrase = longWords(bare).filter(
      (word) => printedWords.has(word) && !allowedWords.has(word),
    );
    if (badQuotes.length > 0 || paraphrase.length > 0) {
      add(
        "paraphrased_study",
        `"${text}" retells a printed study line. Quote whole printed sentences exactly in quotes, or name only the kind, region and date.`,
      );
    }
  }
  return problems;
}

/**
 * Lists every reason an answer breaks the copy rules or states something the cited facts do not hold.
 *
 * @remarks
 * A settled study alert counts as current unless the sentence says "settles" or cites the L reference that settles it.
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
