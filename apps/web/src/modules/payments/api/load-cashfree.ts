import { cashfreeMode, cashfreeScriptUrl } from "../config/payments";
import type { CashfreeCheckout } from "../types";

let loading: Promise<CashfreeCheckout> | undefined;

/**
 * Loads Cashfree's checkout script once and returns the checkout client.
 *
 * @remarks
 * A failed load clears the cached promise, so the next Buy click tries again.
 */
export function loadCashfree() {
  loading ??= new Promise<CashfreeCheckout>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = cashfreeScriptUrl;
    script.onload = () =>
      window.Cashfree
        ? resolve(window.Cashfree({ mode: cashfreeMode }))
        : reject(new Error("Cashfree checkout did not load"));
    script.onerror = () => reject(new Error("Cashfree checkout did not load"));
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
