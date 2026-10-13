import { getT } from "@/common/hooks/use-locale";

/** Turns a credit balance into the label shown next to the upload button. */
export function creditsLeftLabel(credits: number) {
  return getT().credits.left(Math.max(credits, 0));
}

/**
 * Reads the order id that Cashfree adds when it sends the user back to `/credits`.
 *
 * @remarks
 * Checkout redirects instead of opening over the page in some in-app browsers. A value that is not a UUID is dropped.
 */
export function validateCreditsSearch(search: Record<string, unknown>): { order?: string } {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof search.order === "string" && uuid.test(search.order) ? { order: search.order } : {};
}
