import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getFamily() {
  const res = await api.dashboard.family.$get();
  if (!res.ok) throw await problemError(res);
  return res.json();
}
