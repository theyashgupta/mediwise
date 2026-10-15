/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, me, renderApp, resetApp, selfProfile } from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

afterEach(() => {
  vi.restoreAllMocks();
  resetApp();
});

describe.each([
  ["the app shell", "/settings"],
  ["the auth layout", "/forgot-password"],
])("the footer of %s", (_, path) => {
  test("shows the disclaimer and the policy links, and no company line", async () => {
    const t = messages.en;
    fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp(path);

    const footer = await screen.findByTestId("site-footer");
    expect(within(footer).getByText(t.common.disclaimer)).toBeTruthy();
    for (const name of [t.shell.footer.about, ...Object.values(t.payments.policyLinks)]) {
      expect(within(footer).getByRole("link", { name })).toBeTruthy();
    }
    expect(footer.textContent).not.toMatch(/©|Codegenix/);
  });
});
