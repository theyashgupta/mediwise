/** @vitest-environment jsdom */
import { policyVersion } from "@mediwise/shared";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, never, renderApp, resetApp } from "@/test/render-app";

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
  expect(
    screen.getByLabelText(
      "I agree MediWise stores my health reports and uses an AI service to read them, as the Privacy policy describes.",
    ),
  ).toBe(health);

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

async function tickBoth() {
  await userEvent.click(screen.getByTestId("auth-consent-terms"));
  await userEvent.click(screen.getByTestId("auth-consent-health_data"));
}

test("a double click and two Enter presses on Create account send one sign-up request", async () => {
  const requests = fakeNetwork({ "POST /auth/v1/signup": never });
  await renderApp("/signup", { signedIn: false });
  await fillCredentials();
  await tickBoth();

  const submit = screen.getByTestId("auth-submit");
  fireEvent.click(submit);
  fireEvent.click(submit);
  fireEvent.submit(submit.closest("form") as HTMLFormElement);
  fireEvent.submit(submit.closest("form") as HTMLFormElement);

  await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(true));
  expect(requests.filter(({ path }) => path.startsWith("/auth/v1/signup"))).toHaveLength(1);
});

test("a sign-up that starts a session stores both consents before it opens Home", async () => {
  const user = {
    id: "new-user",
    aud: "authenticated",
    role: "authenticated",
    email: "new@example.com",
    user_metadata: { consent_version: policyVersion },
    app_metadata: {},
    created_at: "2026-10-15T00:00:00Z",
  };
  const requests = fakeNetwork({
    "POST /auth/v1/signup": () => ({
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }),
    "POST /me/consents": () =>
      Response.json({ policyVersion, consents: [], missing: [] }, { status: 201 }),
  });
  await renderApp("/signup", { signedIn: false });
  await fillCredentials();
  await tickBoth();

  await userEvent.click(screen.getByTestId("auth-submit"));

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(
    requests.filter(({ method, path }) => method === "POST" && path === "/me/consents"),
  ).toEqual([{ method: "POST", path: "/me/consents", body: { kinds: ["terms", "health_data"] } }]);
});
