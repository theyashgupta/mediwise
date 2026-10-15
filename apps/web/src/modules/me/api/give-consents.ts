import type { ConsentKind } from "@mediwise/shared";
import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function giveConsents(kinds: ConsentKind[]) {
  const res = await api.me.consents.$post({ json: { kinds } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
