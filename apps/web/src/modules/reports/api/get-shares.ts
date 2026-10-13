import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function getShares(reportId: string) {
  const res = await api.reports[":id"].share.$get({ param: { id: reportId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
