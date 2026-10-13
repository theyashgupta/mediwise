import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function createShare(reportId: string) {
  const res = await api.reports[":id"].share.$post({ param: { id: reportId }, json: { days: 7 } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
