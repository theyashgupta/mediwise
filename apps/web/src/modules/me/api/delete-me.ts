import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function deleteMe() {
  const res = await api.me.$delete({ json: { confirm: "DELETE" } });
  if (!res.ok) throw await problemError(res);
}
