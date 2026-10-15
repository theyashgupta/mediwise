import Anthropic from "@anthropic-ai/sdk";
import { patterns } from "@mediwise/engine";
import type { AssistantAnswer, AssistantCite, AssistantRefusalKind } from "@mediwise/shared";
import type { AssistantReviewVerdict } from "../../db/schema.js";
import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { callTool, type StepUsage, stepUsage } from "../extraction/index.js";
import { hasConsent } from "../consents/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import { isOverBudget, stepCostCents } from "../spend/index.js";
import { type AssistantContext, buildContext, nameOf } from "./assistant.context.js";
import { assertQuestionLeft, type QuestionCounts, questionsLeftOf } from "../credits/index.js";
import {
  dailyCapCopy,
  minuteLimitCopy,
  questionsPerDay,
  questionsPerMinute,
  refusalCopy,
  reviewConsentCopy,
  unavailableCopy,
} from "./assistant.copy.js";
import { gateQuestion } from "./assistant.gate.js";
import { answerSystem, answerTool } from "./assistant.prompt.js";
import * as repo from "./assistant.repo.js";
import type { AskQuestionInput } from "./assistant.schemas.js";
import {
  type AnswerInput,
  type AnswerProblem,
  shownSentences,
  validateAnswer,
} from "./assistant.validator.js";

const chatLimit = 50;
const historyPairs = 3;
const historyRows = 10;
const minuteMs = 60 * 1000;
const askedAt = new Map<string, number[]>();

type StoredQuestion = Awaited<ReturnType<typeof repo.insertQuestion>>;

/** Turns a stored question into the item the chat shows, with the fixed copy of its refusal kind. */
function toItem({ answer, refusalKind, flaggedAt, ...row }: StoredQuestion) {
  return {
    ...row,
    refusalKind,
    sentences: answer.sentences,
    copy: refusalKind ? refusalCopy[refusalKind] : null,
    flagged: flaggedAt !== null,
  };
}

const patternNames = new Map(patterns.map(({ key, name }) => [key, name]));

function byId<Row extends { id: string }>(rows: Row[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

/**
 * Gives every cite of the items the name, lab and date its chip shows.
 *
 * @remarks
 * A cite whose report or episode the owner no longer has comes back `deleted` with no labels, so a deleted report or
 * another account's report never shows a name. A cited row that a later read replaced falls back to its report title.
 */
async function withChips(userId: string, items: ReturnType<typeof toItem>[]) {
  const cites = items.flatMap(({ sentences }) => sentences.flatMap(({ cites }) => cites));
  const targets = (kind: AssistantCite["kind"]) => [
    ...new Set(cites.flatMap((cite) => (cite.kind === kind && cite.target ? [cite.target] : []))),
  ];
  const rows = await repo.findCiteRows(userId, {
    reports: [...new Set(cites.flatMap(({ reportId }) => (reportId ? [reportId] : [])))],
    studies: targets("study"),
    findings: targets("finding"),
    followUps: targets("follow_up"),
    episodes: targets("episode"),
  });
  const reports = byId(rows.reports);
  const studies = byId(rows.studies);
  const findings = byId(rows.findings);
  const followUps = byId(rows.followUps);
  const episodes = byId(rows.episodes);
  const deleted = { label: null, labName: null, date: null, deleted: true };

  const chip = (cite: AssistantCite) => {
    const report = cite.reportId ? reports.get(cite.reportId) : undefined;
    if (cite.reportId && !report) return { ...cite, ...deleted };
    const inReport = <Row extends { reportId: string }>(row: Row | undefined) =>
      row?.reportId === cite.reportId ? row : undefined;
    const shown = {
      label: report?.title ?? null,
      labName: report?.labName ?? null,
      date: report?.date ?? null,
      deleted: false,
    };
    const target = cite.target ?? "";
    switch (cite.kind) {
      case "value":
      case "catalog":
        return { ...cite, ...shown, label: nameOf(target, target) };
      case "study": {
        const study = inReport(studies.get(target));
        if (!study) return { ...cite, ...shown };
        return {
          ...cite,
          ...shown,
          label: [study.kind, study.bodyRegion].filter(Boolean).join(", "),
          labName: study.labName ?? shown.labName,
          date: study.performedAt ?? shown.date,
        };
      }
      case "finding":
        return { ...cite, ...shown, label: inReport(findings.get(target))?.title ?? shown.label };
      case "follow_up":
        return { ...cite, ...shown, label: inReport(followUps.get(target))?.title ?? shown.label };
      case "pattern":
        return { ...cite, ...shown, label: patternNames.get(target) ?? shown.label };
      case "episode": {
        const episode = episodes.get(target);
        if (!episode) return { ...cite, ...deleted };
        return { ...cite, ...shown, label: episode.name, date: episode.startedOn };
      }
      case "link":
        return { ...cite, ...shown, label: null };
      default:
        return { ...cite, ...shown };
    }
  };
  return items.map((item) => ({
    ...item,
    sentences: item.sentences.map((sentence) => ({ ...sentence, cites: sentence.cites.map(chip) })),
  }));
}

async function withChip(userId: string, row: StoredQuestion) {
  const [item] = await withChips(userId, [toItem(row)]);
  return item!;
}

/** Writes the question turn: the last pairs of the chat, oldest first, the open report and the new question. */
export function askText(
  question: string,
  history: Pick<StoredQuestion, "question" | "answer" | "refusalKind">[],
  focus?: string,
) {
  const pairs = history.toReversed().map(({ question: earlier, answer, refusalKind }) => {
    const said = [
      ...answer.sentences.map(({ text }) => text),
      ...(refusalKind ? [refusalCopy[refusalKind]] : []),
    ].join(" ");
    return `Question: ${earlier}\nAnswer: ${said}`;
  });
  return [
    ...(pairs.length > 0
      ? [`Earlier questions of this chat, oldest first:\n${pairs.join("\n")}\n`]
      : []),
    ...(focus ? [`The person has ${focus} open.`] : []),
    `New question: ${question}`,
    "Answer with the answer_question tool.",
  ].join("\n");
}

/**
 * Asks Claude for a cited answer and checks it, with one retry that lists the problems.
 *
 * @remarks
 * The profile block carries a cache breakpoint, so a follow-up question within 5 minutes reads it from the cache.
 */
export async function writeAnswer(
  context: AssistantContext,
  ask: string,
  usage: StepUsage,
): Promise<{ input?: AnswerInput; problems: AnswerProblem[] }> {
  const profile: Anthropic.TextBlockParam = {
    type: "text",
    text: context.text,
    cache_control: { type: "ephemeral" },
  };
  const problems: AnswerProblem[] = [];
  const attempt = async (text: string) => {
    const raw = await callTool(answerTool, answerSystem, [profile, { type: "text", text }], usage);
    const { input, problems: found } = validateAnswer(raw, context);
    problems.push(...found);
    return { raw, input, problems: found };
  };
  const first = await attempt(ask);
  if (first.problems.length === 0) return { input: first.input, problems };
  const second = await attempt(retryText(ask, first.raw, first.problems));
  return { input: second.problems.length === 0 ? second.input : undefined, problems };
}

function retryText(ask: string, raw: unknown, problems: AnswerProblem[]) {
  return `${ask}\n\nWe rejected this answer_question input: ${JSON.stringify(raw ?? null)}\nProblems:\n${problems
    .map(({ message }) => `- ${message}`)
    .join("\n")}\nCall answer_question again with an answer that passes every rule.`;
}

function toAnswer(input: AnswerInput, context: AssistantContext): AssistantAnswer {
  return {
    sentences: shownSentences(input).map(({ text, cites }) => ({
      text,
      cites: cites.flatMap((ref) => context.refs.get(ref)?.cite ?? []),
    })),
  };
}

/**
 * Stores one question, and logs only the database error code when the insert fails.
 *
 * @remarks
 * A Drizzle error message carries the query parameters, which are the question and the answer, so it never reaches the
 * shared error handler.
 */
async function store(
  row: Parameters<typeof repo.insertQuestion>[0],
  canCharge?: Parameters<typeof repo.insertQuestion>[1],
): Promise<StoredQuestion> {
  try {
    return await repo.insertQuestion(row, canCharge);
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code ?? "unknown";
    if (code === "23503" && row.focusReportId) {
      return store({ ...row, focusReportId: null }, canCharge);
    }
    log.error(`assistant insert failed code=${code}`);
    if (code === "23503") {
      await repo.insertClearedQuestion(row).catch(() => log.error("assistant usage insert failed"));
      throw new AppError(404, "We could not find this profile");
    }
    throw new AppError(500, "We could not save this question. Try again.");
  }
}

function logQuestion(
  id: string,
  outcome: string,
  rules: string[],
  usage: StepUsage | null,
  started: number,
) {
  log.info(
    `assistant question=${id} outcome=${outcome} rules=${rules.join(",") || "none"} input_tokens=${usage?.inputTokens ?? 0} cached_tokens=${usage?.cachedInputTokens ?? 0} cache_write_tokens=${usage?.cacheWriteTokens ?? 0} output_tokens=${usage?.outputTokens ?? 0} cents=${(usage ? stepCostCents(usage) : 0).toFixed(4)} ms=${Date.now() - started}`,
  );
}

/**
 * Returns the user's questions of the last minute.
 *
 * @remarks
 * ponytail: counts live in this process like `reportCreateLimit`, move them to Postgres if the API runs more than one
 * instance.
 */
function recentAsks(userId: string) {
  return (askedAt.get(userId) ?? []).filter((at) => at > Date.now() - minuteMs);
}

function recordAsk(userId: string) {
  const at = Date.now();
  askedAt.set(userId, [...recentAsks(userId), at]);
  return at;
}

function releaseAsk(userId: string, at: number) {
  const asks = askedAt.get(userId) ?? [];
  const index = asks.indexOf(at);
  if (index >= 0) asks.splice(index, 1);
}

/**
 * Refuses a question that is over a cap or has no quota left, before any Claude call.
 *
 * @remarks
 * The minute slot is taken before the awaited checks, so a parallel burst cannot pass the limit. A refused question
 * gives the slot back, so a 402 retried 7 times never turns into a 429.
 */
async function assertCanAsk(userId: string) {
  if (recentAsks(userId).length >= questionsPerMinute) throw new AppError(429, minuteLimitCopy);
  const at = recordAsk(userId);
  try {
    if ((await repo.countQuestionsToday(userId)) >= questionsPerDay) {
      throw new AppError(429, dailyCapCopy);
    }
    if (await isOverBudget()) throw new AppError(503, unavailableCopy);
    await assertQuestionLeft(userId);
  } catch (error) {
    releaseAsk(userId, at);
    throw error;
  }
}

/**
 * Charges a stored answer only when it cites a fact and the account still has a question left.
 *
 * @returns undefined for a free answer, so the row is stored without the credit lock.
 */
function chargeRule(answer: AssistantAnswer, refusalKind: AssistantRefusalKind | null) {
  const cited = answer.sentences.some(({ cites }) => cites.length > 0);
  if (!cited || refusalKind === "fallback") return undefined;
  return (counts: QuestionCounts) => questionsLeftOf(counts) >= 1;
}

/**
 * Answers one question about one profile and stores it in the chat.
 *
 * @remarks
 * The gate runs before the focus report check, the caps and the quota, so an emergency always gets its copy. A gated
 * question still counts toward the per-minute limit and the daily cap.
 */
export async function askQuestion(userId: string, profileId: string, body: AskQuestionInput) {
  const started = Date.now();
  await getOwnedProfile(userId, profileId);
  if (isReviewRequired() && !(await hasConsent(userId, "assistant_review"))) {
    throw new AppError(403, reviewConsentCopy);
  }
  const focusFound = body.reportId ? await repo.isProfileReport(profileId, body.reportId) : false;
  const base = {
    userId,
    profileId,
    focusReportId: focusFound ? (body.reportId ?? null) : null,
    question: body.question,
  };

  const gated = gateQuestion(body.question);
  if (!gated && body.reportId && !focusFound) {
    throw new AppError(404, "We could not find this report");
  }
  if (gated) {
    recordAsk(userId);
    const row = await store({ ...base, answer: { sentences: [] }, refusalKind: gated });
    logQuestion(row.id, `gate:${gated}`, [], null, started);
    return withChip(userId, row);
  }
  await assertCanAsk(userId);

  const snapshot = await repo.findSnapshot(profileId);
  if (!snapshot) throw new AppError(404, "We could not find this profile");
  if (snapshot.reports.length === 0) {
    const row = await store({ ...base, answer: { sentences: [] }, refusalKind: "not_in_data" });
    logQuestion(row.id, "empty:not_in_data", [], null, started);
    return withChip(userId, row);
  }
  const context = buildContext(snapshot);
  const number = new Map(
    [...context.refs].flatMap(([ref, { cite }]) =>
      cite.kind === "report" && cite.reportId ? [[cite.reportId, ref] as const] : [],
    ),
  );
  const focus = body.reportId ? number.get(body.reportId) : undefined;
  const history = (await repo.listQuestions(userId, profileId, historyRows))
    .filter(({ refusalKind, flaggedAt }) => refusalKind !== "emergency" && flaggedAt === null)
    .slice(0, historyPairs);
  const ask = askText(body.question, history, focus);

  const usage = stepUsage(env.ANTHROPIC_ASSISTANT_MODEL);
  let input: AnswerInput | undefined;
  let rules: string[] = [];
  let failure: string | undefined;
  try {
    const written = await writeAnswer(context, ask, usage);
    input = written.input;
    rules = written.problems.map(({ rule }) => rule);
  } catch (error) {
    failure = error instanceof Anthropic.APIError ? String(error.status) : (error as Error).name;
  }
  const refusalKind: AssistantRefusalKind | null = !input
    ? "fallback"
    : input.kind === "refuse"
      ? (input.refuseKind ?? "fallback")
      : null;
  const answer = input ? toAnswer(input, context) : { sentences: [] };
  const row = await store(
    {
      ...base,
      answer,
      refusalKind,
      rules,
      model: usage.model,
      usage,
      costCents: stepCostCents(usage),
    },
    chargeRule(answer, refusalKind),
  );
  const outcome = failure
    ? `error:${failure}`
    : !input
      ? "fallback"
      : refusalKind
        ? `refuse:${refusalKind}`
        : "answer";
  logQuestion(row.id, outcome, rules, usage, started);
  return withChip(userId, row);
}

export async function listQuestions(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  return withChips(userId, (await repo.listQuestions(userId, profileId, chatLimit)).map(toItem));
}

export async function clearQuestions(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  await repo.clearQuestions(userId, profileId);
}

/** Marks one answer as wrong. Only the time is kept, never a reason. */
export async function flagQuestion(userId: string, id: string) {
  const row = await repo.flagQuestion(userId, id);
  if (!row) throw new AppError(404, "We could not find this question");
  return withChip(userId, row);
}

export function isReviewRequired() {
  return env.ASSISTANT_ENABLED && env.ASSISTANT_REVIEW;
}

/**
 * Loads the sampled questions of one UTC day with their chips and the stored values their value cites name.
 *
 * @remarks
 * Each item is resolved as its own owner, so a cite never shows a row of another account. The owner id stays here and
 * never reaches the item.
 */
export async function loadReviewDay(
  day: string,
  sampled: (row: { id: string; refusalKind: string | null; flagged: boolean }) => boolean,
) {
  const rows = (await repo.listReviewDay(day)).filter((row) =>
    sampled({ id: row.id, refusalKind: row.refusalKind, flagged: row.flaggedAt !== null }),
  );
  return Promise.all(
    rows.map(async ({ userId, ...row }) => {
      const [item] = await withChips(userId, [toItem({ ...row, focusReportId: null })]);
      const values = item!.sentences
        .flatMap(({ cites }) => cites)
        .filter((cite) => cite.kind === "value" && cite.reportId && cite.target && !cite.deleted);
      const facts = await repo.findMarkerFacts(
        userId,
        values.map((cite) => ({ reportId: cite.reportId!, markerKey: cite.target! })),
      );
      return {
        ...item!,
        verdict: row.verdict,
        facts: facts.filter((fact) =>
          values.some((cite) => cite.reportId === fact.reportId && cite.target === fact.markerKey),
        ),
      };
    }),
  );
}

export function storeReview(questionId: string, verdict: AssistantReviewVerdict) {
  return repo.upsertReview(questionId, verdict);
}

export function countReviews() {
  return repo.countReviews();
}
