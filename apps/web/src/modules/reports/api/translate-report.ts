import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function translateReport(id: string) {
  const res = await api.reports[":id"].translation.$post({ param: { id } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
