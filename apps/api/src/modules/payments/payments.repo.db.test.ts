import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { db } from "../../db/client.js";
import { creditsLedger } from "../../db/schema.js";
import { getCreditBalance } from "../credits/index.js";
import { findOrderById, insertOrder, recordPurchase } from "./payments.repo.js";

async function newOrder() {
  const id = randomUUID();
  await insertOrder({ id, userId: randomUUID(), packId: "test-pack", credits: 5, amount: 9900 });
  return (await findOrderById(id))!;
}

async function purchaseRows(orderId: string) {
  return db
    .select({ id: creditsLedger.id })
    .from(creditsLedger)
    .where(and(eq(creditsLedger.paymentOrderId, orderId), eq(creditsLedger.reason, "purchase")));
}

test("two webhooks for one order with different payment ids insert one purchase", async () => {
  const order = await newOrder();

  expect(await recordPurchase(order, `pay_${randomUUID()}`)).toBe(true);
  expect(await recordPurchase(order, `pay_${randomUUID()}`)).toBe(false);

  expect(await purchaseRows(order.id)).toHaveLength(1);
  expect(await getCreditBalance(order.userId)).toBe(5);
  expect(await findOrderById(order.id)).toMatchObject({ status: "paid" });
});

test("two concurrent deliveries of one webhook credit once without a deadlock", async () => {
  const orders = await Promise.all([newOrder(), newOrder(), newOrder()]);

  const results = await Promise.all(
    orders.map(async (order) => {
      const paymentId = `pay_${randomUUID()}`;
      return Promise.all([recordPurchase(order, paymentId), recordPurchase(order, paymentId)]);
    }),
  );

  for (const [index, order] of orders.entries()) {
    expect(results[index]!.toSorted()).toEqual([false, true]);
    expect(await purchaseRows(order.id)).toHaveLength(1);
    expect(await getCreditBalance(order.userId)).toBe(5);
  }
});
