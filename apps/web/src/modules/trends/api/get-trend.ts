import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Loads every point of one marker for a profile.
 *
 * @remarks
 * A 404 returns null, so the page can say the profile has no results for this marker.
 */
export async function getTrend(profileId: string, markerKey: string) {
  const res = await api.trends[":markerKey"].$get({ param: { markerKey }, query: { profileId } });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
