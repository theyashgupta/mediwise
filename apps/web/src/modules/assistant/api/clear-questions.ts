import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function clearQuestions(profileId: string) {
  const res = await api.profiles[":id"].questions.$delete({ param: { id: profileId } });
  if (!res.ok) throw await problemError(res);
}
