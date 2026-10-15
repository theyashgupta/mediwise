import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Loads the newest failed reads.
 *
 * @remarks
 * The API answers 404 to every user but the admin, so it returns null and the page shows not found.
 */
export async function getFailedReports() {
  const res = await api.admin["failed-reports"].$get();
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
