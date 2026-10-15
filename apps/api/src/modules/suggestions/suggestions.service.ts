import { buildSuggestions, type TextLocale } from "@mediwise/engine";
import { loadAttentionInput } from "../dashboard/index.js";
import { getOwnedProfile } from "../profiles/index.js";

/**
 * Lists the rule-based suggestions of one profile from every done report, computed on each read.
 *
 * @remarks
 * The engine writes every line from the catalog, so a read makes no Claude call and stores nothing.
 */
export async function getSuggestions(userId: string, profileId: string, locale: TextLocale) {
  await getOwnedProfile(userId, profileId);
  const { visits, alerts } = await loadAttentionInput(userId, profileId);
  return { suggestions: buildSuggestions(visits, alerts, locale) };
}
