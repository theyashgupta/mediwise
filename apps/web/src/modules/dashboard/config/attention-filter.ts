import type { AttentionItem } from "../types";

export const attentionFilters = ["all", "worsening", "risk", "watch"] as const;

export type AttentionFilter = (typeof attentionFilters)[number];

/**
 * Tells whether an attention row belongs to a filter chip.
 *
 * @remarks
 * Worsening and watch overlap on purpose: a watch marker that worsens shows under both chips, but once in the list.
 */
export function matchesFilter(item: AttentionItem, filter: AttentionFilter) {
  if (filter === "all") return true;
  if (filter === "risk") return item.group === "risk";
  if (item.kind === "alert") return false;
  return filter === "worsening" ? item.direction === "worsening" : item.status === "watch";
}
