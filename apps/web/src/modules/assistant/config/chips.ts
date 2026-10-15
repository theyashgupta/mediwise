import { getT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import type { Cite, FactTarget } from "../types";

export type ChipTarget =
  | ({ kind: "fact" } & FactTarget)
  | { kind: "report"; reportId: string; hash?: string }
  | { kind: "episode"; episodeId: string }
  | { kind: "none" };

const reportHash: Partial<Record<Cite["kind"], (target: string) => string>> = {
  study: (target) => `study-${target}`,
  finding: () => "findings",
  pattern: (target) => `pattern-${target}`,
  follow_up: () => "move-first",
  link: () => "links",
};

/**
 * Picks what a chip opens.
 *
 * @remarks
 * A catalog cite has no report, and a pattern cite whose report has no such pattern has no target, so both stay plain text.
 */
export function chipTarget(cite: Cite): ChipTarget {
  if (cite.deleted) return { kind: "none" };
  if (cite.kind === "episode" && cite.target) return { kind: "episode", episodeId: cite.target };
  if (!cite.reportId || (cite.kind === "pattern" && !cite.target)) return { kind: "none" };
  if (cite.kind === "value" && cite.target) {
    return { kind: "fact", reportId: cite.reportId, markerKey: cite.target };
  }
  const hash = cite.target ? reportHash[cite.kind]?.(cite.target) : undefined;
  return { kind: "report", reportId: cite.reportId, ...(hash && { hash }) };
}

export function chipText(cite: Cite) {
  const t = getT().assistant.chip;
  if (cite.deleted) return cite.kind === "episode" ? t.episodeDeleted : t.deleted;
  const label = cite.label ?? (cite.kind === "link" ? t.repeatStudy : t.report);
  const date =
    cite.date && formatPlainDate(cite.date, { day: "numeric", month: "short", year: "numeric" });
  return [label, cite.labName, date].filter(Boolean).join(" · ");
}
