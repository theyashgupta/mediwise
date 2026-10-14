import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function giveReviewConsent() {
  const res = await api.me["assistant-consent"].$post();
  if (!res.ok) throw await problemError(res);
}
