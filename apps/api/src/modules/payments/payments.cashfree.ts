import { Cashfree, CFEnvironment } from "cashfree-pg";
import { env } from "../../config/env.js";
import type { PaymentProvider } from "./payments.provider.js";
import {
  cashfreePaymentSuccessSchema,
  cashfreeRefundSchema,
  cashfreeWebhookTypeSchema,
} from "./payments.schemas.js";

const placeholderPhone = "9999999999";

let client: Cashfree | undefined;

/**
 * Returns the Cashfree client, created on first use.
 *
 * @remarks
 * Error analytics is off. The SDK default starts Sentry in this process and sends SDK errors to Cashfree.
 */
function cashfree() {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY)
    throw new Error("Cashfree keys are not set");
  client ??= new Cashfree(
    env.CASHFREE_ENV === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    env.CASHFREE_APP_ID,
    env.CASHFREE_SECRET_KEY,
    undefined,
    undefined,
    undefined,
    false,
  );
  return client;
}

const toRupees = (paise: number) => paise / 100;
const toPaise = (rupees: number) => Math.round(rupees * 100);

export const cashfreeProvider: PaymentProvider = {
  /**
   * Creates a Cashfree order whose `order_id` is our order id, and returns its payment session id.
   *
   * @remarks
   * Cashfree requires `customer_phone` and MediWise does not ask for one, so every order sends one placeholder number.
   * `customer_id` allows letters and digits only, so the user id loses its dashes.
   * ponytail: ask for a phone in the buy flow if Cashfree needs a real one for UPI or receipts.
   */
  async createOrder(order) {
    const { data } = await cashfree().PGCreateOrder({
      order_id: order.orderId,
      order_amount: toRupees(order.amount),
      order_currency: "INR",
      customer_details: {
        customer_id: order.userId.replace(/[^a-zA-Z0-9]/g, ""),
        customer_email: order.email,
        customer_phone: placeholderPhone,
      },
      order_meta: {
        return_url: `${env.WEB_ORIGIN}/credits?order={order_id}`,
        notify_url: env.PAYMENTS_WEBHOOK_URL,
      },
      order_note: order.label,
      order_tags: { userId: order.userId, packId: order.packId },
    });
    if (!data.payment_session_id) throw new Error("Cashfree returned no payment session");
    return { sessionId: data.payment_session_id };
  },

  verifyWebhook(rawBody, header) {
    const signature = header("x-webhook-signature");
    const timestamp = header("x-webhook-timestamp");
    if (!signature || !timestamp) return false;
    try {
      cashfree().PGVerifyWebhookSignature(signature, rawBody, timestamp);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reads a webhook into a payment event.
   *
   * @remarks
   * Some webhook versions send `cf_payment_id` and `cf_refund_id` as JSON numbers above 2^53, so they are read from the raw text.
   */
  parseEvent(rawBody) {
    const body: unknown = JSON.parse(rawBody, (key, value, context?: { source?: string }) =>
      (key === "cf_payment_id" || key === "cf_refund_id") && typeof value === "number"
        ? context?.source
        : value,
    );
    const { type } = cashfreeWebhookTypeSchema.parse(body);
    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      const { order, payment } = cashfreePaymentSuccessSchema.parse(body).data;
      return {
        kind: "paid",
        orderId: order.order_id,
        paymentId: payment.cf_payment_id,
        amount: toPaise(payment.payment_amount),
      };
    }
    if (type === "REFUND_STATUS_WEBHOOK") {
      const { refund } = cashfreeRefundSchema.parse(body).data;
      if (refund.refund_status !== "SUCCESS") return { kind: "ignored", type };
      return {
        kind: "refunded",
        orderId: refund.order_id,
        refundId: refund.cf_refund_id,
        amount: toPaise(refund.refund_amount),
      };
    }
    return { kind: "ignored", type };
  },
};
