import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function exportMe() {
  const res = await api.me.export.$get();
  if (!res.ok) throw await problemError(res);
  return res.blob();
}
