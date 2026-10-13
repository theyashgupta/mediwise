import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getSharedReport(token: string) {
  const res = await api.share[":token"].$get({ param: { token } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
