import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function retryFailedReport(id: string) {
  const res = await api.admin.reports[":id"].retry.$post({ param: { id } });
  if (!res.ok) throw await problemError(res);
}
