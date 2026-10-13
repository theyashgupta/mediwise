import type { ProfileUpdate } from "@mediwise/shared";
import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function updateProfile(id: string, input: ProfileUpdate) {
  const res = await api.profiles[":id"].$patch({ param: { id }, json: input });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
