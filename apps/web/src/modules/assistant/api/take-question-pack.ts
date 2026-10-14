import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function takeQuestionPack() {
  const res = await api.me["question-packs"].$post();
  if (!res.ok) throw await problemError(res);
  return res.json();
}
