import { AppError } from "../../common/errors.js";
import { env } from "../../config/env.js";
import { supabase } from "../../lib/supabase.js";
import * as repo from "./credits.repo.js";

export const noCreditsMessage = "You have no report credits left.";
const noFreeCreditMessage = "You have no free credits.";
const readsPerDay = 5;
const questionsPerRead = 5;
const questionsPerPack = 20;
const usersPerPage = 1000;

export async function getCreditBalance(userId: string) {
  return repo.findBalance(userId);
}

/**
 * Tells whether a credit is free after the reports that wait for their debit.
 *
 * @remarks
 * A report is debited only when its read starts, so a waiting report still holds a credit.
 */
function hasFreeCredit(usage: repo.CreditUsage) {
  return usage.balance - usage.waiting >= 1;
}

/**
 * Refuses a new report when the user has no free credit or used the daily reads.
 *
 * @remarks
 * Reports that wait for their debit count against both limits, so a burst of uploads cannot overspend.
 */
export function assertCanAddReport(usage: repo.CreditUsage) {
  if (!hasFreeCredit(usage)) throw new AppError(402, noCreditsMessage);
  if (usage.readsToday + usage.waiting >= readsPerDay) {
    throw new AppError(429, `You can add ${readsPerDay} reports in one day. Try again tomorrow.`);
  }
}

/** Debits one credit when the report's read starts, or fails the read when the user has none. */
export async function chargeReport(reportId: string) {
  if (!(await repo.debitReportCredit(reportId))) throw new AppError(402, noCreditsMessage);
}

export async function refundReport(reportId: string) {
  await repo.refundReportCredit(reportId);
}

export type QuestionsNextStep = "use_credit" | "buy" | "add_report";

/**
 * Picks the next step open to a user with no questions left.
 *
 * @remarks
 * With payments off and no free credit, a new report is the only way to more questions.
 */
function nextStepOf(freeCredit: boolean): QuestionsNextStep {
  if (freeCredit) return "use_credit";
  return env.PAYMENTS_ENABLED ? "buy" : "add_report";
}

const noQuestionsMessage: Record<QuestionsNextStep, string> = {
  use_credit: `You have no questions left. Use 1 credit to get ${questionsPerPack} more questions.`,
  buy: "You have no questions left. Buy credits to ask more questions.",
  add_report: `You have no questions left. Add a report to get ${questionsPerRead} more questions.`,
};

/**
 * Counts the questions the account can still ask from its reads, packs and charged questions.
 *
 * @remarks
 * Never below 0: a read refunded after its questions were used takes back more questions than are left.
 */
export function questionsLeftOf(counts: repo.QuestionCounts) {
  return Math.max(
    0,
    counts.reads * questionsPerRead + counts.packs * questionsPerPack - counts.charged,
  );
}

export async function getQuestionsLeft(userId: string) {
  return questionsLeftOf(await repo.findQuestionCounts(userId));
}

export async function getQuestionState(userId: string) {
  const questionsLeft = await getQuestionsLeft(userId);
  const nextStep =
    questionsLeft >= 1 ? null : nextStepOf(hasFreeCredit(await repo.findCreditUsage(userId)));
  return { questionsLeft, nextStep };
}

/** Refuses a question with 402 when the account has none left, with the copy for its next step. */
export async function assertQuestionLeft(userId: string) {
  const { nextStep } = await getQuestionState(userId);
  if (nextStep) throw new AppError(402, noQuestionsMessage[nextStep]);
}

/** Spends 1 credit on a pack of 20 questions, or answers 402 when no credit is free. */
export async function takeQuestionPack(userId: string) {
  const credits = await repo.debitQuestionPack(
    userId,
    `${questionsPerPack} questions`,
    hasFreeCredit,
  );
  if (credits === undefined) {
    throw new AppError(
      402,
      env.PAYMENTS_ENABLED
        ? `${noFreeCreditMessage} Buy credits to get more questions.`
        : noFreeCreditMessage,
    );
  }
  return { credits, questionsLeft: await getQuestionsLeft(userId) };
}

/** Finds the user id of the account with this email, through the Supabase admin API. */
export async function findUserIdByEmail(email: string) {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: usersPerPage });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === wanted);
    if (user) return user.id;
    if (data.users.length < usersPerPage) throw new Error(`No account has the email ${email}`);
  }
}

/** Adds credits to the account with this email and returns its user id. */
export async function grantCredits(email: string, credits: number, note: string) {
  const userId = await findUserIdByEmail(email);
  await repo.insertGrant(userId, credits, note);
  return userId;
}
