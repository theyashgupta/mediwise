import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { creditsLedger, paymentOrders } from "../../db/schema.js";
import type { Tx } from "../credits/index.js";

type PaymentOrder = typeof paymentOrders.$inferSelect;

export async function insertOrder(order: typeof paymentOrders.$inferInsert) {
  await db.insert(paymentOrders).values(order);
}

export async function findUserOrder(userId: string, id: string) {
  const [row] = await db
    .select({ id: paymentOrders.id, status: paymentOrders.status, credits: paymentOrders.credits })
    .from(paymentOrders)
    .where(and(eq(paymentOrders.id, id), eq(paymentOrders.userId, userId)));
  return row;
}

export async function findOrderById(id: string) {
  const [row] = await db.select().from(paymentOrders).where(eq(paymentOrders.id, id));
  return row;
}

/**
 * Locks one payment order row until the transaction ends.
 *
 * @remarks
 * Without it, two deliveries of one webhook deadlock: each ledger insert holds a key-share lock on the order row, and
 * setting the unique `provider_payment_id` needs a lock that conflicts with it.
 */
async function lockOrder(tx: Tx, id: string) {
  await tx
    .select({ id: paymentOrders.id })
    .from(paymentOrders)
    .where(eq(paymentOrders.id, id))
    .for("update");
}

/**
 * Credits the pack of a paid order and marks the order paid, and returns false when the order was credited before.
 *
 * @remarks
 * The order row is locked first, so two webhooks for one order run one after the other. The second hits the one-purchase-per-order index and inserts nothing.
 */
export async function recordPurchase(order: PaymentOrder, providerPaymentId: string) {
  return db.transaction(async (tx) => {
    await lockOrder(tx, order.id);
    const inserted = await tx
      .insert(creditsLedger)
      .values({
        userId: order.userId,
        delta: order.credits,
        reason: "purchase",
        paymentOrderId: order.id,
        paymentRef: providerPaymentId,
      })
      .onConflictDoNothing()
      .returning({ id: creditsLedger.id });
    if (inserted.length === 0) return false;
    await tx
      .update(paymentOrders)
      .set({ status: "paid", providerPaymentId, paidAt: sql`now()` })
      .where(eq(paymentOrders.id, order.id));
    return true;
  });
}

/**
 * Debits the refunded credits and marks the order refunded, and returns false when this refund was debited before.
 *
 * @remarks
 * The unique `payment_ref` holds the refund id, so each partial refund of one order debits once.
 */
export async function recordRefund(order: PaymentOrder, providerRefundId: string, credits: number) {
  return db.transaction(async (tx) => {
    await lockOrder(tx, order.id);
    const inserted = await tx
      .insert(creditsLedger)
      .values({
        userId: order.userId,
        delta: -credits,
        reason: "refund",
        paymentOrderId: order.id,
        paymentRef: providerRefundId,
      })
      .onConflictDoNothing({ target: creditsLedger.paymentRef })
      .returning({ id: creditsLedger.id });
    if (inserted.length === 0) return false;
    await tx
      .update(paymentOrders)
      .set({ status: "refunded" })
      .where(eq(paymentOrders.id, order.id));
    return true;
  });
}
