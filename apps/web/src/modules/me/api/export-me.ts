import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function exportMe() {
  const res = await api.me.export.$get({ query: { files: "1" } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
