import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

/**
 * Downloads a profile's values as a CSV blob.
 *
 * @remarks
 * Reads a blob, not text, because `Response.text()` drops the BOM that Excel needs to read the file as UTF-8.
 */
export async function exportProfileCsv(id: string) {
  const res = await api.profiles[":id"]["export.csv"].$get({ param: { id } });
  if (!res.ok) throw await problemError(res);
  return res.blob();
}
