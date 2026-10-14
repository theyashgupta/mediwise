import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function askQuestion(
  profileId: string,
  json: { question: string; reportId?: string },
) {
  const res = await api.profiles[":id"].questions.$post({ param: { id: profileId }, json });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
