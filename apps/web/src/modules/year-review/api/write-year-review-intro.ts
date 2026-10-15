import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/** Asks the API to write the intro of a year in review, the only year in review call that can reach Claude. */
export async function writeYearReviewIntro(profileId: string) {
  const res = await api.profiles[":id"]["year-review"].intro.$post({ param: { id: profileId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
