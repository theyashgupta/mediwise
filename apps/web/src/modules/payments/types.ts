import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type PaymentPack = InferResponseType<typeof api.payments.packs.$get, 200>[number];

export type CheckoutResult = {
  error?: { message?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

export type CashfreeCheckout = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_modal";
  }) => Promise<CheckoutResult>;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckout;
  }
}
