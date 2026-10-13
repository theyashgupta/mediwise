import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function listQuestions(profileId: string) {
  const res = await api.profiles[":id"].questions.$get({ param: { id: profileId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
