/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import {
  fakeNetwork,
  me,
  never,
  problem,
  renderApp,
  resetApp,
  selfProfile,
} from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

afterEach(resetApp);

describe.each(["en", "hi"] as const)("the account in %s", (locale) => {
  const t = messages[locale];
  const identity = () => screen.getByRole("region", { name: t.settings.identity.title });
  const credits = () => screen.getByRole("region", { name: t.settings.credits.title });
  const nameInput = () =>
    within(identity()).findByRole("textbox", { name: t.settings.nameForm.name });

  test("the account shows a loading state and no balance while it loads", async () => {
    fakeNetwork({ "GET /me": never, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    await screen.findByRole("heading", { level: 1, name: t.settings.title });
    expect(within(identity()).getByText(t.common.loading)).toBeTruthy();
    expect(within(credits()).queryByRole("link", { name: t.settings.credits.more })).toBeNull();
  });

  test("the account shows the name, the email and the credit balance", async () => {
    fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    expect(await nameInput()).toHaveProperty("value", me.name);
    expect(
      within(identity()).getByRole("textbox", { name: t.settings.nameForm.email }),
    ).toHaveProperty("value", me.email);
    expect(within(credits()).getByText(t.credits.left(2))).toBeTruthy();
    expect(
      within(credits()).getByRole("link", { name: t.settings.credits.more }).getAttribute("href"),
    ).toBe("/credits");
  });

  test("an account with no credits shows a zero balance", async () => {
    fakeNetwork({ "GET /me": () => ({ ...me, credits: 0 }), "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    expect(await within(credits()).findByText(t.credits.left(0))).toBeTruthy();
  });

  test("a failed account load shows the error, and retry loads the account", async () => {
    let failing = true;
    fakeNetwork({
      "GET /me": () => (failing ? problem(500) : me),
      "GET /profiles": () => [selfProfile],
    });
    await renderApp("/settings", { locale });

    const alert = await within(identity()).findByRole("alert");
    expect(within(alert).getByText(t.settings.loadError)).toBeTruthy();

    failing = false;
    await userEvent.click(within(alert).getByRole("button", { name: t.common.retry }));

    expect(await nameInput()).toHaveProperty("value", me.name);
  });
});

describe("rename", () => {
  const t = messages.en;
  const identity = () => screen.getByRole("region", { name: t.settings.identity.title });

  async function rename(name: string) {
    const input = await within(identity()).findByRole("textbox", {
      name: t.settings.nameForm.name,
    });
    await userEvent.clear(input);
    if (name) await userEvent.type(input, name);
    await userEvent.click(
      within(identity()).getByRole("button", { name: t.settings.nameForm.save }),
    );
  }

  test("a new name is saved through the API and shown", async () => {
    let account = me;
    const requests = fakeNetwork({
      "GET /me": () => account,
      "GET /profiles": () => [selfProfile],
      "PATCH /me": (request) => {
        account = { ...account, ...(request.body as { name: string }) };
        return account;
      },
    });
    await renderApp("/settings");

    await rename("Asha R.");

    expect(await screen.findByText(t.settings.nameSaved)).toBeTruthy();
    expect(await within(identity()).findByDisplayValue("Asha R.")).toBeTruthy();
    expect(requests).toContainEqual({ method: "PATCH", path: "/me", body: { name: "Asha R." } });
  });

  test("an empty name shows the form message and sends nothing", async () => {
    const requests = fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings");

    await rename("");

    expect(await within(identity()).findByText(t.settings.nameForm.nameRequired)).toBeTruthy();
    expect(requests.some((r) => r.method === "PATCH")).toBe(false);
  });

  test("a rejected name shows the message the API sends", async () => {
    fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [selfProfile],
      "PATCH /me": () => problem(422, "Enter a name of 80 characters or fewer"),
    });
    await renderApp("/settings");

    await rename("Asha R.");

    expect(await within(identity()).findByRole("alert")).toHaveProperty(
      "textContent",
      "Enter a name of 80 characters or fewer",
    );
    expect(screen.queryByText(t.settings.nameSaved)).toBeNull();
  });
});
