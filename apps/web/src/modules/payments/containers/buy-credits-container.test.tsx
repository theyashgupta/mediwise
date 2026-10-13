/** @vitest-environment jsdom */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import type { CheckoutResult } from "../types";

/**
 * Loads the app with the payments flag on, whatever `apps/web/.env` says.
 *
 * @remarks
 * The payments module reads the flag once when it loads, so the app is imported only after the flag is set.
 */
async function loadAppWithPayments() {
  vi.stubEnv("VITE_PAYMENTS_ENABLED", "true");
  return import("@/test/render-app");
}

const app = await loadAppWithPayments();

const orderId = "00000000-0000-4000-8000-0000000000c3";

const packs = [
  { id: "pack_1", credits: 1, amount: 4900, label: "1 report credit" },
  { id: "pack_5", credits: 5, amount: 19950, label: "5 report credits" },
];

let checkout: (options: { paymentSessionId: string }) => Promise<CheckoutResult>;
let observer: MutationObserver | undefined;

/**
 * Stands in for Cashfree's checkout script, the third-party edge of the checkout.
 *
 * @remarks
 * jsdom never fetches a script, so the fake answers the script tag the app adds: it defines `window.Cashfree` and
 * fires `load`. The app keeps the loaded client, so its checkout calls the `checkout` of the current test.
 */
function fakeCashfree() {
  const sessions: string[] = [];
  checkout = async ({ paymentSessionId }) => {
    sessions.push(paymentSessionId);
    return { paymentDetails: { paymentMessage: "Payment finished" } };
  };
  observer = new MutationObserver(() => {
    const script = document.head.querySelector<HTMLScriptElement>("script[src*='cashfree']");
    if (!script) return;
    script.remove();
    window.Cashfree = () => ({ checkout: (options) => checkout(options) });
    script.dispatchEvent(new Event("load"));
  });
  observer.observe(document.head, { childList: true });
  return sessions;
}

const sentences = (text: string) => text.split(/(?<=[.।?])\s+/).filter(Boolean);

afterEach(() => {
  observer?.disconnect();
  app.resetApp();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe.each(["en", "hi"] as const)("the checkout in %s", (locale) => {
  const t = messages[locale];

  test("the packs show a loading state while they load", async () => {
    app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": app.never,
    });
    await app.renderApp("/credits", { locale });

    const main = screen.getByRole("main");
    expect(await within(main).findByText(t.credits.left(2))).toBeTruthy();
    expect(within(main).getByText(t.common.loading)).toBeTruthy();
    expect(within(main).queryByRole("heading", { name: t.payments.buy.title })).toBeNull();
  });

  test("the pack list shows each pack the API sends, with its price and a Buy button", async () => {
    app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => packs,
    });
    await app.renderApp("/credits", { locale });

    expect(await screen.findByRole("heading", { name: t.payments.buy.title })).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: /report credit/ });
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(
      packs.map((pack) => t.payments.buy.buyPack(pack.label)),
    );
    const cards = buttons.map((button) => button.closest("li")?.textContent);
    expect(cards[0]).toContain("1 report credit₹49");
    expect(cards[1]).toContain("5 report credits₹199.50");
  });

  test("an account with no credits and no packs shows the empty balance and no Buy button", async () => {
    app.fakeNetwork({
      "GET /me": () => ({ ...app.me, credits: 0 }),
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => [],
    });
    await app.renderApp("/credits", { locale });

    expect(await screen.findByText(t.credits.none)).toBeTruthy();
    expect(await screen.findByRole("heading", { name: t.payments.buy.title })).toBeTruthy();
    expect(screen.queryByRole("button", { name: t.payments.buy.buy })).toBeNull();
  });

  test("a failed pack load shows the error, and retry loads the packs", async () => {
    let failing = true;
    app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => (failing ? app.problem(500) : packs),
    });
    await app.renderApp("/credits", { locale });

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(t.payments.buy.loadError)).toBeTruthy();

    failing = false;
    await userEvent.click(within(alert).getByRole("button", { name: t.common.retry }));

    expect(
      await screen.findByRole("button", { name: t.payments.buy.buyPack("1 report credit") }),
    ).toBeTruthy();
  });

  test("a Buy click creates an order, opens checkout and shows the pending state", async () => {
    const sessions = fakeCashfree();
    const requests = app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => packs,
      "POST /payments/orders": () =>
        Response.json(
          { id: orderId, sessionId: "session_test_1", amount: 19950, currency: "INR" },
          { status: 201 },
        ),
      [`GET /payments/orders/${orderId}`]: () => ({ id: orderId, status: "created", credits: 5 }),
    });
    await app.renderApp("/credits", { locale });

    await userEvent.click(
      await screen.findByRole("button", { name: t.payments.buy.buyPack("5 report credits") }),
    );

    expect(await screen.findByText(t.payments.status.waiting)).toBeTruthy();
    expect(sessions).toEqual(["session_test_1"]);
    expect(requests).toContainEqual({
      method: "POST",
      path: "/payments/orders",
      body: { packId: "pack_5" },
    });
  });

  test("a paid order shows the credits it added and the new balance", async () => {
    let credits = 2;
    app.fakeNetwork({
      "GET /me": () => ({ ...app.me, credits }),
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => packs,
      [`GET /payments/orders/${orderId}`]: () => {
        credits = 7;
        return { id: orderId, status: "paid", credits: 5 };
      },
    });
    await app.renderApp(`/credits?order=${orderId}`, { locale });

    expect(await screen.findByText(t.payments.status.paid(5))).toBeTruthy();
    expect(await screen.findByText(t.credits.left(7))).toBeTruthy();
  });

  test("a checkout that does not open shows a short message that says what to do", async () => {
    fakeCashfree();
    checkout = async () => {
      throw new Error("The checkout window was blocked");
    };
    app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
      "GET /payments/packs": () => packs,
      "POST /payments/orders": () =>
        Response.json({ id: orderId, sessionId: "session_test_1", amount: 4900, currency: "INR" }),
    });
    await app.renderApp("/credits", { locale });

    const buy = await screen.findByRole("button", {
      name: t.payments.buy.buyPack("1 report credit"),
    });
    await userEvent.click(buy);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(t.payments.buy.checkoutError);
    expect(alert.textContent).not.toContain(";");
    for (const sentence of sentences(t.payments.buy.checkoutError)) {
      expect(sentence.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
    expect(buy).toHaveProperty("disabled", false);
  });
});

test("a pending order turns to paid when the next check finds the payment", async () => {
  fakeCashfree();
  let status = "created";
  app.fakeNetwork({
    "GET /me": () => app.me,
    "GET /profiles": () => [app.selfProfile],
    "GET /payments/packs": () => packs,
    [`GET /payments/orders/${orderId}`]: () => {
      const order = { id: orderId, status, credits: 1 };
      status = "paid";
      return order;
    },
  });
  await app.renderApp(`/credits?order=${orderId}`);

  expect(await screen.findByText(messages.en.payments.status.waiting)).toBeTruthy();
  expect(
    await screen.findByText(messages.en.payments.status.paid(1), {}, { timeout: 4000 }),
  ).toBeTruthy();
});

test("an order the API refuses shows the API message and opens no checkout", async () => {
  const sessions = fakeCashfree();
  app.fakeNetwork({
    "GET /me": () => app.me,
    "GET /profiles": () => [app.selfProfile],
    "GET /payments/packs": () => packs,
    "POST /payments/orders": () => app.problem(503, "Payments are paused. Try again later"),
  });
  await app.renderApp("/credits");

  await userEvent.click(
    await screen.findByRole("button", {
      name: messages.en.payments.buy.buyPack("1 report credit"),
    }),
  );

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Payments are paused. Try again later",
  );
  expect(sessions).toEqual([]);
});

test("a closed checkout shows no status and lets the user buy again", async () => {
  fakeCashfree();
  checkout = async () => ({});
  const requests = app.fakeNetwork({
    "GET /me": () => app.me,
    "GET /profiles": () => [app.selfProfile],
    "GET /payments/packs": () => packs,
    "POST /payments/orders": () =>
      Response.json({ id: orderId, sessionId: "session_test_1", amount: 4900, currency: "INR" }),
  });
  await app.renderApp("/credits");

  const buy = await screen.findByRole("button", {
    name: messages.en.payments.buy.buyPack("1 report credit"),
  });
  await userEvent.click(buy);

  await waitFor(() => expect(buy).toHaveProperty("disabled", false));
  expect(screen.queryByRole("status")).toBeNull();
  expect(requests.some((r) => r.path.startsWith("/payments/orders/"))).toBe(false);
});
