import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getReports(profileId: string, cursor?: string) {
  const res = await api.reports.$get({ query: { profileId, cursor } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
