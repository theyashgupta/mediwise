import type { UpdateMeInput } from "@mediwise/shared";
import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function updateMe(input: UpdateMeInput) {
  const res = await api.me.$patch({ json: input });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
