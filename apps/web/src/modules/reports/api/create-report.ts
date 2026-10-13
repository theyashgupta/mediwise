import type { CreateReportInput } from "@mediwise/shared";
import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function createReport(input: CreateReportInput) {
  const res = await api.reports.$post({ json: input });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
