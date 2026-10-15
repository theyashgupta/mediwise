/** @vitest-environment jsdom */
import { policyVersion } from "@mediwise/shared";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, renderApp, resetApp } from "@/test/render-app";

const t = messages.en;

afterEach(resetApp);

async function fillCredentials() {
  await userEvent.type(await screen.findByTestId("auth-email"), "new@example.com");
  await userEvent.type(screen.getByTestId("auth-password"), "e2e-Password-1");
}

test("both consent boxes start clear, and submit with them clear shows two errors and makes no account", async () => {
  const requests = fakeNetwork({});
  await renderApp("/signup", { signedIn: false });
  await fillCredentials();

  const terms = screen.getByTestId("auth-consent-terms") as HTMLInputElement;
  const health = screen.getByTestId("auth-consent-health_data") as HTMLInputElement;
  expect(terms.checked).toBe(false);
  expect(health.checked).toBe(false);
  const form = within(screen.getByTestId("auth-submit").closest("form") as HTMLElement);
  expect(form.getByRole("link", { name: t.me.consent.termsLink }).getAttribute("href")).toBe(
    "/terms",
  );
  expect(form.getByRole("link", { name: t.me.consent.healthLink }).getAttribute("href")).toBe(
    "/privacy",
  );

  await userEvent.click(screen.getByTestId("auth-submit"));

  expect(await screen.findAllByText(t.me.consent.required)).toHaveLength(2);
  expect(requests.some(({ path }) => path.startsWith("/auth/v1/signup"))).toBe(false);
});

test("one ticked box still blocks the sign-up", async () => {
  const requests = fakeNetwork({});
  await renderApp("/signup", { signedIn: false });
  await fillCredentials();
  await userEvent.click(screen.getByTestId("auth-consent-terms"));

  await userEvent.click(screen.getByTestId("auth-submit"));

  expect(await screen.findAllByText(t.me.consent.required)).toHaveLength(1);
  expect(requests.some(({ path }) => path.startsWith("/auth/v1/signup"))).toBe(false);
});

test("with both boxes ticked the sign-up sends the policy version in the user metadata", async () => {
  const requests = fakeNetwork({
    "POST /auth/v1/signup": () => ({
      id: "new-user",
      aud: "authenticated",
      email: "new@example.com",
      user_metadata: { consent_version: policyVersion },
      app_metadata: {},
      created_at: "2026-10-15T00:00:00Z",
    }),
  });
  await renderApp("/signup", { signedIn: false });
  await fillCredentials();
  await userEvent.click(screen.getByTestId("auth-consent-terms"));
  await userEvent.click(screen.getByTestId("auth-consent-health_data"));

  await userEvent.click(screen.getByTestId("auth-submit"));

  await waitFor(() =>
    expect(requests.find(({ path }) => path.startsWith("/auth/v1/signup"))?.body).toMatchObject({
      email: "new@example.com",
      data: { consent_version: policyVersion },
    }),
  );
});
