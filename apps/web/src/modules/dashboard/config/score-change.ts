import { getT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import type { Status } from "@/common/utils/status";

/**
 * Writes the score change since the previous visit and the status colour that goes with it.
 *
 * @remarks
 * The year shows only when the previous visit is in another year than the latest one.
 */
export function scoreChange(delta: { score: number; since: string }, latestDate: string) {
  const sameYear = delta.since.slice(0, 4) === latestDate.slice(0, 4);
  const since = formatPlainDate(delta.since, {
    day: "numeric",
    month: "short",
    ...(!sameYear && { year: "numeric" }),
  });
  if (delta.score === 0)
    return { value: getT().dashboard.latest.noChange, since, status: "unknown" as Status };
  return {
    value: `${delta.score > 0 ? "+" : "−"}${Math.abs(delta.score)}`,
    since,
    status: (delta.score > 0 ? "optimal" : "risk") as Status,
  };
}
