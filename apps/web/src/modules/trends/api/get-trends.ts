import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getTrends(profileId: string) {
  const res = await api.trends.$get({ query: { profileId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
