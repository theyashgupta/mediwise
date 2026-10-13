import { getIntlTag } from "@/common/hooks/use-locale";

export const errorClassLabels: Record<string, string> = {
  unreadable_file: "File did not open",
  no_values: "No lab values found",
  duplicate: "Duplicate file",
  too_large: "Files too large",
  missing_birth_date: "No date of birth",
  no_credits: "No credits left",
  upstream: "Claude or network error",
  worker_stopped: "Worker stopped",
  unexpected: "Unexpected error",
};

/**
 * Formats US cents as dollars.
 *
 * @remarks
 * One read costs a fraction of a cent, so amounts under one dollar keep four decimals.
 */
export function formatCents(cents: number) {
  return (cents / 100).toLocaleString(getIntlTag(), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents < 100 ? 4 : 2,
  });
}

export function formatPaise(paise: number) {
  return (paise / 100).toLocaleString(getIntlTag(), { style: "currency", currency: "INR" });
}

export function formatCount(count: number) {
  return count.toLocaleString(getIntlTag());
}

/** Formats a wait in milliseconds as whole minutes, or hours and minutes past one hour. */
export function formatWait(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
