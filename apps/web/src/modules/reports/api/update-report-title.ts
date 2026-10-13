import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function updateReportTitle({ reportId, title }: { reportId: string; title: string }) {
  const res = await api.reports[":id"].title.$put({ param: { id: reportId }, json: { title } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
