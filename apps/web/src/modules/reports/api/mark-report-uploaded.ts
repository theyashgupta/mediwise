import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function markReportUploaded(id: string) {
  const res = await api.reports[":id"].uploaded.$post({ param: { id } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
