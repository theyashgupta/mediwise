/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

/**
 * Loads the app with the payments flag off, whatever `apps/web/.env` says.
 *
 * @remarks
 * The payments module reads the flag once when it loads, so the app is imported only after the flag is set.
 */
async function loadAppWithoutPayments() {
  vi.stubEnv("VITE_PAYMENTS_ENABLED", "false");
  return import("@/test/render-app");
}

const app = await loadAppWithoutPayments();

afterEach(app.resetApp);

afterAll(() => {
  vi.unstubAllEnvs();
});

describe.each(["en", "hi"] as const)("the credits page with payments off, in %s", (locale) => {
  const t = messages[locale];
  const main = () => screen.getByRole("main");

  test("the page shows a loading state while the balance loads", async () => {
    app.fakeNetwork({ "GET /me": app.never, "GET /profiles": () => [app.selfProfile] });
    await app.renderApp("/credits", { locale });

    expect(await within(main()).findByText(t.common.loading)).toBeTruthy();
    expect(within(main()).queryByText(t.credits.cannotBuy)).toBeNull();
  });

  test("the page shows the balance and hides the checkout", async () => {
    const requests = app.fakeNetwork({
      "GET /me": () => app.me,
      "GET /profiles": () => [app.selfProfile],
    });
    await app.renderApp("/credits", { locale });

    expect(await within(main()).findByText(t.credits.left(2))).toBeTruthy();
    expect(within(main()).getByText(t.credits.cannotBuy)).toBeTruthy();
    expect(within(main()).getByText(t.credits.contact)).toBeTruthy();
    expect(within(main()).queryByRole("heading", { name: t.payments.buy.title })).toBeNull();
    expect(within(main()).queryByRole("button", { name: t.payments.buy.buy })).toBeNull();
    expect(requests.some((r) => r.path.startsWith("/payments"))).toBe(false);
  });

  test("an account with no credits shows that none are left", async () => {
    app.fakeNetwork({
      "GET /me": () => ({ ...app.me, credits: 0 }),
      "GET /profiles": () => [app.selfProfile],
    });
    await app.renderApp("/credits", { locale });

    expect(await within(main()).findByText(t.credits.none)).toBeTruthy();
  });

  test("a failed load shows the error, and retry loads the balance", async () => {
    let failing = true;
    app.fakeNetwork({
      "GET /me": () => (failing ? app.problem(500) : app.me),
      "GET /profiles": () => [app.selfProfile],
    });
    await app.renderApp("/credits", { locale });

    const alert = await within(main()).findByRole("alert");
    expect(within(alert).getByText(t.credits.loadError)).toBeTruthy();

    failing = false;
    await userEvent.click(within(alert).getByRole("button", { name: t.common.retry }));

    expect(await within(main()).findByText(t.credits.left(2))).toBeTruthy();
  });
});
