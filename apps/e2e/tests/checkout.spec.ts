import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { apiEnv, apiPort } from "../local-env";

const email = `e2e-checkout-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const paymentSuccess = new URL("../../api/fixtures/cashfree/payment-success.json", import.meta.url);

const checkoutScript = `window.Cashfree = () => ({
  checkout: () => Promise.resolve({ paymentDetails: { paymentMessage: "e2e" } }),
});`;

/**
 * Sends the Cashfree payment webhook for one order, signed with the e2e secret key as Cashfree signs it.
 *
 * @remarks
 * Each call gets a new payment id, because the ledger credits one payment id once and the local database keeps old runs.
 */
async function sendPaidWebhook(orderId: string, rupees: number) {
  const event = JSON.parse(await readFile(paymentSuccess, "utf8")) as {
    data: {
      order: { order_id: string };
      payment: { cf_payment_id: string; payment_amount: number };
    };
  };
  event.data.order.order_id = orderId;
  event.data.payment.cf_payment_id = String(Date.now());
  event.data.payment.payment_amount = rupees;
  const body = JSON.stringify(event);
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", apiEnv.CASHFREE_SECRET_KEY)
    .update(timestamp + body)
    .digest("base64");
  return fetch(`http://localhost:${apiPort}/payments/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-timestamp": timestamp,
      "x-webhook-signature": signature,
    },
    body,
  });
}

test("a pack bought through the stubbed Cashfree checkout adds its credits after the webhook", async ({
  page,
}) => {
  const cashfreeCalls: string[] = [];
  await page.route(/cashfree\.com/, (route) => {
    cashfreeCalls.push(route.request().url());
    return route.fulfill({ contentType: "text/javascript", body: checkoutScript });
  });

  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-consent-terms").check();
  await page.getByTestId("auth-consent-health_data").check();
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  await page.goto("/credits");
  await expect(page.getByTestId("credits-balance")).toBeVisible();
  const [order] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/payments/orders") && res.ok()),
    page.getByTestId("pack-buy-pack_5").click(),
  ]);
  const { id, sessionId, amount } = (await order.json()) as {
    id: string;
    sessionId: string;
    amount: number;
  };
  expect(sessionId).toBe(`session_stub_${id}`);
  await expect(page.getByTestId("purchase-status-waiting")).toBeVisible();

  expect((await sendPaidWebhook(id, amount / 100)).status).toBe(200);

  await expect(page.getByTestId("purchase-status-paid")).toBeVisible();
  await expect(page.getByTestId("credits-balance")).toContainText("5");
  expect(cashfreeCalls).toEqual(["https://sdk.cashfree.com/js/v3/cashfree.js"]);
});
