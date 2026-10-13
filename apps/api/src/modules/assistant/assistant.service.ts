import Anthropic from "@anthropic-ai/sdk";
import type { AssistantAnswer, AssistantRefusalKind } from "@mediwise/shared";
import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { log } from "../../middleware/logger.js";
import { callTool, type StepUsage, stepUsage } from "../extraction/index.js";
import { getOwnedProfile } from "../profiles/index.js";
import { isOverBudget, stepCostCents } from "../spend/index.js";
import { type AssistantContext, buildContext } from "./assistant.context.js";
import { refusalCopy, unavailableCopy } from "./assistant.copy.js";
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
 * The profile block carries a cache breakpoint, so a follow-up question within 5 minutes reads it from the cache. A
 * second failure returns no input, and the caller shows the fixed fallback copy.
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
async function store(row: Parameters<typeof repo.insertQuestion>[0]) {
  try {
    return await repo.insertQuestion(row);
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code ?? "unknown";
    log.error(`assistant insert failed code=${code}`);
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
 * Answers one question about one profile and stores it in the chat.
 *
 * @remarks
 * The gate runs before the spend cap, so an emergency always gets its copy. A Claude error stores the fallback copy
 * with the tokens already spent, so the question is never lost.
 */
export async function askQuestion(userId: string, profileId: string, body: AskQuestionInput) {
  const started = Date.now();
  await getOwnedProfile(userId, profileId);
  if (body.reportId && !(await repo.isProfileReport(profileId, body.reportId))) {
    throw new AppError(404, "We could not find this report");
  }
  const base = {
    userId,
    profileId,
    focusReportId: body.reportId ?? null,
    question: body.question,
  };

  const gated = gateQuestion(body.question);
  if (gated) {
    const row = await store({ ...base, answer: { sentences: [] }, refusalKind: gated });
    logQuestion(row.id, `gate:${gated}`, [], null, started);
    return toItem(row);
  }
  if (await isOverBudget()) throw new AppError(503, unavailableCopy);

  const snapshot = await repo.findSnapshot(profileId);
  if (!snapshot) throw new AppError(404, "We could not find this profile");
  if (snapshot.reports.length === 0) {
    const row = await store({ ...base, answer: { sentences: [] }, refusalKind: "not_in_data" });
    logQuestion(row.id, "empty:not_in_data", [], null, started);
    return toItem(row);
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
    failure = error instanceof Anthropic.APIError ? String(error.status) : "call";
  }
  const refusalKind: AssistantRefusalKind | null = !input
    ? "fallback"
    : input.kind === "refuse"
      ? (input.refuseKind ?? "fallback")
      : null;
  const row = await store({
    ...base,
    answer: input ? toAnswer(input, context) : { sentences: [] },
    refusalKind,
    rules,
    model: usage.model,
    usage,
    costCents: stepCostCents(usage),
  });
  const outcome = failure
    ? `error:${failure}`
    : !input
      ? "fallback"
      : refusalKind
        ? `refuse:${refusalKind}`
        : "answer";
  logQuestion(row.id, outcome, rules, usage, started);
  return toItem(row);
}

/** Lists the chat of one profile, newest first. */
export async function listQuestions(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  return (await repo.listQuestions(userId, profileId, chatLimit)).map(toItem);
}

export async function clearQuestions(userId: string, profileId: string) {
  await getOwnedProfile(userId, profileId);
  await repo.deleteQuestions(userId, profileId);
}

/** Marks one answer as wrong. Only the time is kept, never a reason. */
export async function flagQuestion(userId: string, id: string) {
  const row = await repo.flagQuestion(userId, id);
  if (!row) throw new AppError(404, "We could not find this question");
  return toItem(row);
}
