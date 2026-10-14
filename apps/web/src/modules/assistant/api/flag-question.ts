import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function flagQuestion(id: string) {
  const res = await api.questions[":id"].flag.$post({ param: { id } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
