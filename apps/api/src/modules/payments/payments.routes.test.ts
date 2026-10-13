import { Cashfree, type CreateOrderRequest } from "cashfree-pg";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, expect, test, vi } from "vitest";
import { Hono } from "hono";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { paymentsRoutes, paymentsWebhookRoutes } from "./payments.routes.js";

type Order = {
  id: string;
  userId: string;
  packId: string;
  credits: number;
  amount: number;
  providerPaymentId: string | null;
  status: "created" | "paid" | "refunded";
};

const store = vi.hoisted(() => ({
  orders: [] as Order[],
  ledger: [] as {
    userId: string;
    delta: number;
    reason: string;
    paymentRef: string;
    orderId: string;
  }[],
}));

vi.mock("./payments.repo.js", () => {
  /** Inserts a ledger row unless it breaks a unique index: one `paymentRef`, one purchase per order. */
  const insertLedger = (order: Order, delta: number, reason: string, paymentRef: string) => {
    const taken = store.ledger.some(
      (row) =>
        row.paymentRef === paymentRef ||
        (reason === "purchase" && row.reason === "purchase" && row.orderId === order.id),
    );
    if (taken) return false;
    store.ledger.push({ userId: order.userId, delta, reason, paymentRef, orderId: order.id });
    return true;
  };
  return {
    insertOrder: async (order: Order) => {
      store.orders.push({ ...order, providerPaymentId: null, status: "created" });
    },
    findUserOrder: async (userId: string, id: string) => {
      const order = store.orders.find((row) => row.id === id && row.userId === userId);
      return order && { id: order.id, status: order.status, credits: order.credits };
    },
    findOrderById: async (id: string) => store.orders.find((order) => order.id === id),
    recordPurchase: async (order: Order, paymentId: string) => {
      if (!insertLedger(order, order.credits, "purchase", paymentId)) return false;
      Object.assign(order, { status: "paid", providerPaymentId: paymentId });
      return true;
    },
    recordRefund: async (order: Order, refundId: string, credits: number) => {
      if (!insertLedger(order, -credits, "refund", refundId)) return false;
      order.status = "refunded";
      return true;
    },
  };
});

const app = new Hono<AuthEnv>()
  .route("/payments", paymentsWebhookRoutes)
  .use(async (c, next) => {
    c.set("userId", "dev-user");
    c.set("email", "dev-user@example.com");
    await next();
  })
  .route("/payments", paymentsRoutes);
app.onError(handleError);

const cashfreeOrders: CreateOrderRequest[] = [];
vi.spyOn(Cashfree.prototype, "PGCreateOrder").mockImplementation(async (request) => {
  cashfreeOrders.push(request);
  return { data: { payment_session_id: "session_test" } } as Awaited<
    ReturnType<Cashfree["PGCreateOrder"]>
  >;
});

const secretKey = "test-cashfree-secret";
const fixture = (name: string) =>
  readFileSync(new URL(`../../../fixtures/cashfree/${name}`, import.meta.url), "utf8");
const fixtureOrderId = "6f1c2d3e-4b5a-4c6d-8e7f-901234567890";
const paymentSuccess = fixture("payment-success.json");
const refundSuccess = fixture("refund-success.json");

function sign(timestamp: string, body: string) {
  return createHmac("sha256", secretKey)
    .update(timestamp + body)
    .digest("base64");
}

function sendWebhook(body: string, signature?: string) {
  const timestamp = "1791830000000";
  return app.request("/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": signature ?? sign(timestamp, body),
    },
    body,
  });
}

async function buyPack(packId: string, extra: Record<string, unknown> = {}) {
  const res = await app.request("/payments/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packId, ...extra }),
  });
  const body = (await res.json()) as { id: string };
  const forOrder = (webhook: string) => webhook.replaceAll(fixtureOrderId, body.id);
  return { res, body, forOrder };
}

const balance = () => store.ledger.reduce((sum, row) => sum + row.delta, 0);

beforeEach(() => {
  store.orders.length = 0;
  store.ledger.length = 0;
  cashfreeOrders.length = 0;
  env.PAYMENTS_ENABLED = true;
  env.CASHFREE_APP_ID = "test-app-id";
  env.CASHFREE_SECRET_KEY = secretKey;
});

test("with the flag off every payments route answers 404 and no Cashfree order is created", async () => {
  env.PAYMENTS_ENABLED = false;
  expect((await app.request("/payments/packs")).status).toBe(404);
  expect((await buyPack("pack_5")).res.status).toBe(404);
  expect((await sendWebhook(paymentSuccess)).status).toBe(404);
  expect((await app.request(`/payments/orders/${fixtureOrderId}`)).status).toBe(404);
  expect(cashfreeOrders).toEqual([]);
});

test("an order takes its amount and credits from the pack config, never from the client", async () => {
  const { res, body } = await buyPack("pack_5", { amount: 100, credits: 500 });

  expect(res.status).toBe(201);
  expect(body).toMatchObject({ amount: 19900, currency: "INR", sessionId: "session_test" });
  expect(cashfreeOrders).toMatchObject([
    {
      order_id: body.id,
      order_amount: 199,
      order_currency: "INR",
      customer_details: { customer_id: "devuser", customer_email: "dev-user@example.com" },
      order_tags: { userId: "dev-user", packId: "pack_5" },
    },
  ]);
  expect(store.orders[0]).toMatchObject({
    id: body.id,
    userId: "dev-user",
    credits: 5,
    amount: 19900,
  });
});

test("an unknown pack id answers 400 and creates no order", async () => {
  expect((await buyPack("pack_free")).res.status).toBe(400);
  expect(cashfreeOrders).toEqual([]);
});

test("a webhook with a wrong or missing signature answers 400 and credits nothing", async () => {
  const { forOrder } = await buyPack("pack_5");
  const body = forOrder(paymentSuccess);

  expect((await sendWebhook(body, sign("1", body))).status).toBe(400);
  expect((await app.request("/payments/webhook", { method: "POST", body })).status).toBe(400);
  expect(balance()).toBe(0);
});

test("a payment success credits the pack once, even when Cashfree delivers it twice", async () => {
  const { body, forOrder } = await buyPack("pack_5");

  expect((await sendWebhook(forOrder(paymentSuccess))).status).toBe(200);
  expect((await sendWebhook(forOrder(paymentSuccess))).status).toBe(200);

  expect(store.ledger).toMatchObject([
    { userId: "dev-user", delta: 5, reason: "purchase", paymentRef: "5114910439041" },
  ]);
  const order = await app.request(`/payments/orders/${body.id}`);
  expect(await order.json()).toEqual({ id: body.id, status: "paid", credits: 5 });
});

test("one payment sent in two webhook versions, with a string id and a large numeric id, credits once with the exact id", async () => {
  const { forOrder } = await buyPack("pack_5");
  const stringId = forOrder(paymentSuccess).replace('"5114910439041"', '"1463222168694445568"');
  const numericId = forOrder(paymentSuccess).replace('"5114910439041"', "1463222168694445568");

  await Promise.all([sendWebhook(numericId), sendWebhook(stringId)]);

  expect(store.ledger).toMatchObject([{ delta: 5, paymentRef: "1463222168694445568" }]);
});

test("a payment whose amount differs from the order credits nothing", async () => {
  const { forOrder } = await buyPack("pack_1");
  expect((await sendWebhook(forOrder(paymentSuccess))).status).toBe(200);
  expect(balance()).toBe(0);
});

test("a refund debits the pack once, even when Cashfree delivers it twice", async () => {
  const { forOrder } = await buyPack("pack_5");
  await sendWebhook(forOrder(paymentSuccess));

  expect((await sendWebhook(forOrder(refundSuccess))).status).toBe(200);
  expect((await sendWebhook(forOrder(refundSuccess))).status).toBe(200);

  expect(balance()).toBe(0);
  expect(store.ledger.filter((row) => row.reason === "refund")).toHaveLength(1);
  expect(store.orders[0]?.status).toBe("refunded");
});

test("a partial refund debits only the refunded share of the pack", async () => {
  const { forOrder } = await buyPack("pack_5");
  await sendWebhook(forOrder(paymentSuccess));
  const partial = forOrder(refundSuccess).replace(
    '"refund_amount": 199.0',
    '"refund_amount": 119.4',
  );

  await sendWebhook(partial);

  expect(balance()).toBe(2);
});

test("an event MediWise does not handle is acknowledged and changes nothing", async () => {
  await buyPack("pack_5");
  const failed = JSON.stringify({ type: "PAYMENT_FAILED_WEBHOOK", data: {} });
  expect((await sendWebhook(failed)).status).toBe(200);
  expect(store.ledger).toEqual([]);
});

test("a user cannot read another user's order", async () => {
  const { body } = await buyPack("pack_5");
  Object.assign(store.orders[0] ?? {}, { userId: "someone-else" });
  expect((await app.request(`/payments/orders/${body.id}`)).status).toBe(404);
});
