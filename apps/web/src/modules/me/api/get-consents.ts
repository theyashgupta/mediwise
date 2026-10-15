import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getConsents() {
  const res = await api.me.consents.$get();
  if (!res.ok) throw await problemError(res);
  return res.json();
}
