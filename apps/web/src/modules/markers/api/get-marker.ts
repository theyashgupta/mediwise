import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Loads one marker of a report.
 *
 * @remarks
 * A 404 returns null, so the page can say the marker is not in this report instead of showing an error.
 */
export async function getMarker(reportId: string, markerKey: string) {
  const res = await api.reports[":id"].markers[":markerKey"].$get({
    param: { id: reportId, markerKey },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
