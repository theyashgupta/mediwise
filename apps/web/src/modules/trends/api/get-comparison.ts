import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Compares two reports of one profile.
 *
 * @remarks
 * A 404 returns null, so a link to a deleted report shows a message instead of an error.
 */
export async function getComparison(query: { a?: string; b?: string; profileId?: string }) {
  const res = await api.compare.$get({ query });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
