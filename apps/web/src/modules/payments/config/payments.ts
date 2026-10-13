export const paymentsEnabled = import.meta.env.VITE_PAYMENTS_ENABLED === "true";

export const cashfreeMode: "sandbox" | "production" =
  import.meta.env.VITE_CASHFREE_MODE === "production" ? "production" : "sandbox";

export const cashfreeScriptUrl = "https://sdk.cashfree.com/js/v3/cashfree.js";

export const orderPollMs = 2000;
export const orderPollLimitMs = 120_000;

/** Formats an amount in paise as whole rupees, with paise only when there are some. */
export function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}
