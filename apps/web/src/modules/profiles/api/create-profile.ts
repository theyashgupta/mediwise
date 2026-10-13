import type { ProfileInput } from "@mediwise/shared";
import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function createProfile(input: ProfileInput) {
  const res = await api.profiles.$post({ json: input });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
