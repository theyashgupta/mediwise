import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function updateReportNote({ reportId, note }: { reportId: string; note: string }) {
  const res = await api.reports[":id"].note.$put({ param: { id: reportId }, json: { note } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
