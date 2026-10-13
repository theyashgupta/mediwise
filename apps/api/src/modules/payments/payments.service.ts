import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors.js";
import { log } from "../../middleware/logger.js";
import { cashfreeProvider } from "./payments.cashfree.js";
import { paymentCurrency, paymentPacks } from "./payments.config.js";
import * as repo from "./payments.repo.js";

const provider = cashfreeProvider;

export function listPacks() {
  return paymentPacks;
}

/**
 * Creates a provider order for one pack and stores it as a `created` payment order.
 *
 * @remarks
 * The amount and credits come from `payments.config.ts`, never from the client.
 */
export async function createOrder(userId: string, email: string, packId: string) {
  const pack = paymentPacks.find((candidate) => candidate.id === packId);
  if (!pack) throw new AppError(400, "This pack does not exist.");
  const id = randomUUID();
  const { sessionId } = await provider.createOrder({
    orderId: id,
    amount: pack.amount,
    userId,
    email,
    packId: pack.id,
    label: pack.label,
  });
  await repo.insertOrder({
    id,
    userId,
    packId: pack.id,
    credits: pack.credits,
    amount: pack.amount,
  });
  return { id, sessionId, amount: pack.amount, currency: paymentCurrency };
}

export async function getOrder(userId: string, id: string) {
  const order = await repo.findUserOrder(userId, id);
  if (!order) throw new AppError(404, "Order not found");
  return order;
}

/**
 * Verifies a payment webhook over its raw body and applies a payment or a refund.
 *
 * @remarks
 * Every other event is acknowledged and ignored, so the provider does not retry it.
 */
export async function handleWebhook(rawBody: string, header: (name: string) => string | undefined) {
  if (!provider.verifyWebhook(rawBody, header)) {
    throw new AppError(400, "The webhook signature is not valid.");
  }
  const event = provider.parseEvent(rawBody);
  if (event.kind === "ignored") return;
  const order = await repo.findOrderById(event.orderId);
  if (!order) return log.warn(`webhook ${event.kind} for unknown order=${event.orderId}`);
  if (event.kind === "paid") {
    if (event.amount !== order.amount) {
      return log.error(
        `webhook payment amount does not match order=${order.id} paid=${event.amount} expected=${order.amount}`,
      );
    }
    if (await repo.recordPurchase(order, event.paymentId)) {
      log.info(`payment credited order=${order.id} credits=${order.credits}`);
    }
    return;
  }
  const credits = refundedCredits(order, event.amount);
  if (await repo.recordRefund(order, event.refundId, credits)) {
    log.info(`refund debited order=${order.id} credits=${credits}`);
  }
}

/**
 * Converts a refunded amount to the credits it pays back.
 *
 * @remarks
 * A partial refund debits its share of the pack, rounded, so refunding 3 of 5 credits at the pack's price per credit debits 3.
 */
function refundedCredits(order: { credits: number; amount: number }, refundedAmount: number) {
  return Math.round((order.credits * refundedAmount) / order.amount);
}
