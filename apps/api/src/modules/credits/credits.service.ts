import { AppError } from "../../common/errors.js";
import { supabase } from "../../lib/supabase.js";
import * as repo from "./credits.repo.js";

export const noCreditsMessage = "You have no report credits left.";
const readsPerDay = 5;
const usersPerPage = 1000;

export async function getCreditBalance(userId: string) {
  return repo.findBalance(userId);
}

/**
 * Refuses a new report when the user has no free credit or used the daily reads.
 *
 * @remarks
 * Reports that wait for their debit count against both limits, so a burst of uploads cannot overspend.
 */
export function assertCanAddReport(usage: Awaited<ReturnType<typeof repo.findCreditUsage>>) {
  if (usage.balance - usage.waiting < 1) throw new AppError(402, noCreditsMessage);
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
