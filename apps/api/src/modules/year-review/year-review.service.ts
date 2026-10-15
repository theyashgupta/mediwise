import { createHash } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { coverageCap } from "@mediwise/engine";
import { z } from "zod";
import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { callTool, type StepUsage, stepUsage } from "../extraction/index.js";
import { type NarrativeProblem, validateNarrative } from "../narrative/index.js";
import { isOverBudget, stepCostCents } from "../spend/index.js";
import { listSeries, verdictChange, visitDate } from "../trends/index.js";
import * as repo from "./year-review.repo.js";

type Loaded = Awaited<ReturnType<typeof listSeries>>;
type Point = Loaded["series"][number]["points"][number];
export type YearReview = NonNullable<ReturnType<typeof buildYearReview>>;

const windowMonths = 13;
const maxIntroSentences = 4;

/** Returns the ISO date a number of calendar months before an ISO date. */
export function monthsBefore(date: string, months: number) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCMonth(day.getUTCMonth() - months);
  return day.toISOString().slice(0, 10);
}

function reading(point: Point) {
  return { value: point.value, status: point.status, date: visitDate(point) };
}

/**
 * Builds the year in review from a profile's done reports and marker series, or null when it has fewer than two visits.
 *
 * @remarks
 * The window ends at the latest report and starts 13 months before it, so a yearly test that comes a few weeks late still
 * counts. Reports of one collection date are one visit, the same rule as the trend pages. The score compares the first
 * and last of the broadest panels only, so a glucose-only report never reads as a score drop.
 */
export function buildYearReview(reports: Loaded["reports"], series: Loaded["series"]) {
  const last = reports.at(-1);
  if (!last) return null;
  const to = visitDate(last);
  const since = monthsBefore(to, windowMonths);
  const inWindow = reports.filter((report) => visitDate(report) >= since);
  const from = visitDate(inWindow[0]!);
  if (from === to) return null;

  const ids = new Set(inWindow.map((report) => report.id));
  const scored = inWindow.filter((report) => report.score !== null);
  const cap = (report: (typeof inWindow)[number]) => coverageCap(report.coverage ?? 100, 100);
  const broadest = Math.max(...scored.map(cap));
  const broad = scored.filter((report) => cap(report) === broadest);
  const [firstBroad, lastBroad] = [broad[0], broad.at(-1)];
  const twoDates = firstBroad && lastBroad && visitDate(firstBroad) !== visitDate(lastBroad);
  const labs = new Set(
    inWindow.flatMap((report) => report.labNames.map((name) => name.trim().toLowerCase())),
  );

  const moved = [];
  const stillAtRisk = [];
  const measuredOnce = [];
  for (const { markerKey, name, unit, precision, points: all } of series) {
    const points = all.filter((point) => ids.has(point.reportId));
    const first = points[0];
    const latest = points.at(-1);
    if (!first || !latest) continue;
    const marker = { markerKey, name, unit, precision };
    if (points.length === 1) {
      measuredOnce.push({ ...marker, ...reading(first) });
      continue;
    }
    const change = verdictChange(first.status, latest.status);
    const values = { from: reading(first), to: reading(latest) };
    if (change === "improved" || change === "worsened") {
      moved.push({ ...marker, direction: change, ...values });
    } else if (latest.status === "risk") {
      stillAtRisk.push({ ...marker, ...values });
    }
  }

  return {
    from,
    to,
    reportCount: inWindow.length,
    labCount: labs.size,
    score: {
      from: twoDates ? firstBroad.score : null,
      to: twoDates ? lastBroad.score : null,
    },
    moved,
    stillAtRisk,
    measuredOnce,
  };
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Writes the intro from the review data alone, for when Claude gives no intro that passes the validator. */
export function engineIntro(review: YearReview) {
  const { score, moved, stillAtRisk, reportCount, labCount } = review;
  const better = moved.filter(({ direction }) => direction === "improved").length;
  const worse = moved.length - better;
  const sentences = [
    labCount > 0
      ? `This review covers ${plural(reportCount, "report")} from ${plural(labCount, "lab")}.`
      : `This review covers ${plural(reportCount, "report")}.`,
  ];
  if (score.from !== null && score.to !== null) {
    sentences.push(
      score.from === score.to
        ? `Your score stayed at ${score.to}.`
        : `Your score went from ${score.from} to ${score.to}.`,
    );
  }
  if (better > 0) sentences.push(`${plural(better, "marker")} moved to a better status.`);
  if (worse > 0) sentences.push(`${plural(worse, "marker")} moved to a worse status.`);
  if (moved.length === 0) sentences.push("No marker moved to a different status.");
  if (stillAtRisk.length > 0) {
    sentences.push(`${plural(stillAtRisk.length, "marker")} kept risk status.`);
  }
  return sentences;
}

const introExample = {
  sentences: [
    { text: "Your score went from 78 to 84 across two reports.", citedKeys: [] },
    { text: "Vitamin D moved from risk to watch status.", citedKeys: ["vitamin_d"] },
    {
      text: "LDL cholesterol kept its risk status in both reports.",
      citedKeys: ["ldl_cholesterol"],
    },
  ],
};

const system = `You write a short intro for the year in review of one person's lab reports. The user message gives the review facts and the review key list. Call the write_intro tool once.

Rules:
1. Write 2 to ${maxIntroSentences} sentences. Each sentences item holds one sentence.
2. Each sentence has 20 words or fewer. Aim for 15 words. Name three markers or fewer in one sentence.
3. Do not use a semicolon. Use active voice. Do not use a phrasal verb.
4. Cite in citedKeys each marker that the sentence names, and only those. Copy each key exactly from the review key list.
5. Start with the most important change. Do not list every marker.
6. Say what the facts say and nothing more. Do not add a cause, a diagnosis or a fact that is not in the facts.
7. Keep every hedge. "May be low" stays "may be low". Never make a hedge into a fact.
8. Do not use diagnosis words. Do not write "you have", "diagnosed" or "disease".
9. Do not name a drug. Do not give a supplement dose. Do not tell the reader what to do.
10. Use these words: report, marker, value, score, status. Use the status names optimal, watch and risk.
11. Keep the medical names the facts use, for example HbA1c or LDL.

An intro that passes every rule, as write_intro input:
${JSON.stringify(introExample)}`;

function introShape(key: z.ZodType<string>) {
  return z.object({
    sentences: z
      .array(
        z.object({
          text: z.string().trim().min(1).describe("One sentence of 20 words or fewer"),
          citedKeys: z
            .array(key)
            .describe("Keys from the review key list that this sentence names"),
        }),
      )
      .min(1)
      .max(maxIntroSentences),
  });
}
const introSchema = introShape(z.string());

function introTool(keys: string[]): Anthropic.Tool {
  const key = keys.length > 0 ? z.enum(keys as [string, ...string[]]) : z.string();
  return {
    name: "write_intro",
    description:
      "Records the plain-English intro of one year in review, one cited sentence at a time.",
    input_schema: z.toJSONSchema(introShape(key)) as Anthropic.Tool.InputSchema,
  };
}

/** Writes the review data as short lines with every marker key, the only facts Claude may use. */
export function reviewFacts(review: YearReview) {
  const value = (reading: { value: number; status: string }, unit: string | null) =>
    `${reading.value}${unit ? ` ${unit}` : ""} (${reading.status === "unknown" ? "no status" : reading.status})`;
  const lines = [
    `Review window: ${review.from} to ${review.to}. Reports: ${review.reportCount}. Labs: ${review.labCount}.`,
    `Score: ${review.score.from ?? "none"} at the start, ${review.score.to ?? "none"} at the end.`,
    "",
    "Review key list. Cite only these keys.",
    "Markers that moved to a different status (key | name | first value | last value | change):",
    ...review.moved.map(
      (m) =>
        `${m.markerKey} | ${m.name} | ${value(m.from, m.unit)} | ${value(m.to, m.unit)} | ${m.direction}`,
    ),
    "Markers with risk status at the start and at the end (key | name | first value | last value):",
    ...review.stillAtRisk.map(
      (m) => `${m.markerKey} | ${m.name} | ${value(m.from, m.unit)} | ${value(m.to, m.unit)}`,
    ),
    "Markers measured once, with no trend (key | name | value):",
    ...review.measuredOnce.map((m) => `${m.markerKey} | ${m.name} | ${value(m, m.unit)}`),
  ];
  return lines.join("\n");
}

/**
 * Asks Claude for the intro and returns its sentences once they pass the narrative validator.
 *
 * @remarks
 * A rejected draft gets one more call with the problems listed. A second rejection returns null.
 */
async function writeIntro(facts: string, keys: string[], usage: StepUsage) {
  const allowed = new Set(keys);
  const tool = introTool(keys);
  const factsBlock: Anthropic.TextBlockParam = { type: "text", text: facts };
  const ask = "Write the intro for this year in review with the write_intro tool.";
  const draft = async (text: string) => {
    const input = await callTool(tool, system, [factsBlock, { type: "text", text }], usage);
    const parsed = introSchema.safeParse(input);
    if (!parsed.success) {
      const message =
        input === undefined ? "No write_intro call was made." : z.prettifyError(parsed.error);
      return {
        sentences: null,
        problems: [{ rule: "invalid_call", message }] as NarrativeProblem[],
      };
    }
    const sentences = parsed.data.sentences;
    const problems = validateNarrative(
      sentences.map((sentence) => ({ ...sentence, section: "The headline" as const })),
      allowed,
    );
    return { sentences, problems };
  };

  const first = await draft(ask);
  if (first.sentences && first.problems.length === 0)
    return first.sentences.map(({ text }) => text);
  const reasons = first.problems.map(({ message, index }) =>
    index === undefined ? message : `"${first.sentences?.[index]?.text}" ${message}`,
  );
  const second = await draft(
    `${ask}\n\nWe rejected your previous write_intro call:\n${reasons.map((reason) => `- ${reason}`).join("\n")}\nCall it again and fix every problem.`,
  );
  if (second.sentences && second.problems.length === 0) {
    return second.sentences.map(({ text }) => text);
  }
  log.warn("Year review intro rejected twice", [...first.problems, ...second.problems]);
  return null;
}

function introHash(model: string, facts: string) {
  return createHash("sha256").update(`${model}\n${system}\n${facts}`).digest("hex");
}

async function loadReview(userId: string, profileId: string) {
  const { reports, series } = await listSeries(userId, profileId);
  const review = buildYearReview(reports, series);
  if (!review) {
    throw new AppError(404, "A year in review needs two reports from one year");
  }
  return review;
}

/**
 * Returns the stored intro of a review, or null when none matches the current review facts.
 *
 * @remarks
 * The hash covers the model, the system prompt and the facts, so a new report or a prompt change reads as no intro.
 */
async function cachedIntro(profileId: string, review: YearReview, hash: string) {
  const cached = await repo.findIntro(profileId);
  if (cached?.hash !== hash) return null;
  return cached.sentences ?? engineIntro(review);
}

/**
 * Loads the year in review of one profile with its stored intro, and never calls Claude.
 *
 * @remarks
 * Home loads this on every visit, and a Claude call on Home load is not allowed. The intro is null until the user asks for it.
 */
export async function getYearReview(userId: string, profileId: string) {
  const review = await loadReview(userId, profileId);
  const hash = introHash(env.ANTHROPIC_NARRATIVE_MODEL, reviewFacts(review));
  return { ...review, intro: await cachedIntro(profileId, review, hash) };
}

/**
 * Writes the intro of a year in review with Claude when no stored intro matches, and returns the review with it.
 *
 * @remarks
 * A rejected intro is stored as null too, so the next request never pays for a call the validator already refused. Over
 * the monthly cap the engine text answers and nothing is stored, so a later request can still write the Claude intro.
 */
export async function writeYearReviewIntro(userId: string, profileId: string) {
  const review = await loadReview(userId, profileId);
  const facts = reviewFacts(review);
  const model = env.ANTHROPIC_NARRATIVE_MODEL;
  const hash = introHash(model, facts);
  const cached = await cachedIntro(profileId, review, hash);
  if (cached) return { ...review, intro: cached };
  if (await isOverBudget()) return { ...review, intro: engineIntro(review) };

  const keys = [...review.moved, ...review.stillAtRisk, ...review.measuredOnce].map(
    ({ markerKey }) => markerKey,
  );
  const usage = stepUsage(model);
  try {
    const sentences = await writeIntro(facts, keys, usage);
    await repo.saveIntro(profileId, { hash, sentences });
    return { ...review, intro: sentences ?? engineIntro(review) };
  } catch (error) {
    log.warn("Year review intro failed", error);
    return { ...review, intro: engineIntro(review) };
  } finally {
    log.info(`Year review intro cost ${stepCostCents(usage).toFixed(4)} cents`, usage);
  }
}
