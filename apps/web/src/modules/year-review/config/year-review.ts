import { formatPlainDate } from "@/common/utils/date";

/** Keeps only a string `profileId` from the URL search. */
export function validateYearReviewSearch(search: Record<string, unknown>) {
  return { profileId: typeof search.profileId === "string" ? search.profileId : undefined };
}

export function formatReviewDate(date: string) {
  return formatPlainDate(date, { day: "numeric", month: "short", year: "numeric" });
}
