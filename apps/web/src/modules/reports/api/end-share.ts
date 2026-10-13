import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function endShare({ reportId, shareId }: { reportId: string; shareId: string }) {
  const res = await api.reports[":id"].share[":shareId"].$delete({
    param: { id: reportId, shareId },
  });
  if (!res.ok) throw await problemError(res);
}
