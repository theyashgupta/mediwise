import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getEarlierValues(reportId: string) {
  const res = await api.compare.earlier.$get({ query: { reportId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
