import { getIntlTag } from "@/common/hooks/use-locale";

export const errorClassLabels: Record<string, string> = {
  unreadable_file: "File did not open",
  no_values: "No lab values found",
  duplicate: "Duplicate file",
  too_large: "Files too large",
  missing_birth_date: "No date of birth",
  no_credits: "No credits left",
  upstream: "Upstream or network error",
  worker_stopped: "Worker stopped",
  unexpected: "Unexpected error",
};

export const kindLabels: Record<string, string> = {
  grant: "Credit granted",
  purchase: "Credits bought",
  upload: "Report credit used",
  refund: "Report credit returned",
  purchase_refund: "Payment refunded",
  questions: "Question pack bought",
  question: "Question used",
};

export function formatCount(count: number) {
  return count.toLocaleString(getIntlTag());
}

/** Formats a change of credits with its sign, so a debit and a credit read apart. */
export function formatCreditChange(delta: number) {
  return delta.toLocaleString(getIntlTag(), { signDisplay: "exceptZero" });
}

export function formatCredits(credits: number) {
  const count = Math.abs(credits);
  return `${formatCount(count)} ${count === 1 ? "credit" : "credits"}`;
}
