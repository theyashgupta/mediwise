import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getProfiles() {
  const res = await api.profiles.$get();
  if (!res.ok) throw await problemError(res);
  return res.json();
}
