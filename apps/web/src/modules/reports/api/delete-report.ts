import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function deleteReport(id: string) {
  const res = await api.reports[":id"].$delete({ param: { id } });
  if (!res.ok) throw await problemError(res);
}
