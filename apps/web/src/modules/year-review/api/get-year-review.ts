import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Loads the year in review of one profile.
 *
 * @remarks
 * A 404 means the profile has fewer than two reports in one year, so it returns null and the caller shows no review.
 */
export async function getYearReview(profileId: string) {
  const res = await api.profiles[":id"]["year-review"].$get({ param: { id: profileId } });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
