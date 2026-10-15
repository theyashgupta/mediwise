import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";
import type { CreditFilter } from "../types";

/**
 * Loads the credit history for the filter.
 *
 * @remarks
 * The API answers 404 to every user but the admin, so it returns null and the page shows not found.
 */
export async function getCreditHistory(filter: CreditFilter) {
  const res = await api.admin.credits.$get({ query: filter });
  if (res.status === 404) return null;
  if (!res.ok) throw await problemError(res);
  return res.json();
}
