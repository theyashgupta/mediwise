import { z } from "zod";
import { paymentPacks } from "./payments.config.js";

const packIds = paymentPacks.map((pack) => pack.id) as [string, ...string[]];

export const createOrderSchema = z.object({ packId: z.enum(packIds) });

export const orderParamsSchema = z.object({ id: z.uuid() });

const cashfreeId = z.union([z.string(), z.number()]).transform(String);

export const cashfreeWebhookTypeSchema = z.object({ type: z.string() });

/**
 * The parts of a Cashfree payment success webhook that MediWise reads.
 *
 * @remarks
 * Ids arrive as numbers in some webhook versions and as strings in others, so both are read as strings.
 */
export const cashfreePaymentSuccessSchema = z.object({
  data: z.object({
    order: z.object({ order_id: z.string() }),
    payment: z.object({ cf_payment_id: cashfreeId, payment_amount: z.number() }),
  }),
});

export const cashfreeRefundSchema = z.object({
  data: z.object({
    refund: z.object({
      cf_refund_id: cashfreeId,
      order_id: z.string(),
      refund_amount: z.number(),
      refund_status: z.string(),
    }),
  }),
});
