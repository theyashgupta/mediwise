import { getT } from "@/common/hooks/use-locale";
import type { Dashboard, RetestDate } from "../types";

/**
 * Builds up to 3 questions from the dashboard data, with no Claude call.
 *
 * @remarks
 * `retests` are the ones Home shows, so a value measured in the last 30 days is not suggested.
 */
export function askSuggestions(
  { moveFirst, newestFinding }: Pick<Dashboard, "moveFirst" | "newestFinding">,
  retests: RetestDate[],
) {
  const t = getT().dashboard.ask;
  return [
    moveFirst[0] && t.changed(moveFirst[0].name),
    newestFinding && t.finding(newestFinding.title),
    retests[0] && t.retest(retests[0].name),
  ].filter((question): question is string => Boolean(question));
}
