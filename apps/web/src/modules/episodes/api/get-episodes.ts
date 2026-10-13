import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getEpisodes(profileId: string) {
  const res = await api.profiles[":id"].episodes.$get({ param: { id: profileId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}

/**
 * Loads one episode with its timeline, markers, studies and summary.
 *
 * @remarks
 * A 404 means the episode is gone or belongs to another account, so it returns null and the page says so.
 */
export async function getEpisode(id: string) {
  const res = await api.episodes[":id"].$get({ param: { id } });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
