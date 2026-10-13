import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function deleteProfile(id: string) {
  const res = await api.profiles[":id"].$delete({ param: { id } });
  if (!res.ok) throw await problemError(res);
}
