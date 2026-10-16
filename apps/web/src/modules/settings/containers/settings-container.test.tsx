/** @vitest-environment jsdom */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { localeNames, messages } from "@/config/messages";
import {
  fakeNetwork,
  me,
  never,
  problem,
  renderApp,
  resetApp,
  selfProfile,
  type SentRequest,
} from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

afterEach(resetApp);

const region = (name: string) => screen.getByRole("region", { name });

describe.each(["en", "hi"] as const)("settings in %s", (locale) => {
  const t = messages[locale];
  const profile = () => region(t.settings.profile.title);
  const dateOfBirth = () => within(profile()).findByLabelText(t.profiles.form.dateOfBirth);

  test("the profile section shows a loading state while the profiles load", async () => {
    fakeNetwork({ "GET /me": () => me, "GET /profiles": never });
    await renderApp("/settings", { locale });

    await screen.findByRole("heading", { level: 1, name: t.settings.title });
    expect(within(profile()).getByText(t.common.loading)).toBeTruthy();
  });

  test("the profile section shows the saved date of birth, sex and ancestry", async () => {
    fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    expect(await dateOfBirth()).toHaveProperty("value", selfProfile.dateOfBirth);
    const select = (name: string) => within(profile()).getByRole("combobox", { name });
    expect(select(t.profiles.form.sex).textContent).toBe(t.profiles.sex.female);
    expect(select(t.profiles.form.ancestry).textContent).toBe(t.profiles.ancestry.south_asian);
    expect(within(profile()).queryByText(t.profiles.approximate)).toBeNull();
  });

  test("a profile with no details shows empty fields with their hints", async () => {
    fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [{ ...selfProfile, dateOfBirth: null, sex: null, reportCount: 0 }],
    });
    await renderApp("/settings", { locale });

    expect(await dateOfBirth()).toHaveProperty("value", "");
    expect(within(profile()).getByText(t.profiles.form.sexPlaceholder)).toBeTruthy();
    expect(within(profile()).getByText(t.profiles.form.sexHint)).toBeTruthy();
  });

  test("a failed profile load shows the error, and retry loads the profile", async () => {
    let failing = true;
    fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => (failing ? problem(500) : [selfProfile]),
    });
    await renderApp("/settings", { locale });

    expect(await within(profile()).findByText(t.profiles.self.loadError)).toBeTruthy();

    failing = false;
    await userEvent.click(within(profile()).getByRole("button", { name: t.common.retry }));

    expect(await dateOfBirth()).toHaveProperty("value", selfProfile.dateOfBirth);
  });
});

test("a switch to Hindi changes the page, and saves the choice on the device and in the account", async () => {
  const requests = fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "PUT /auth/v1/user": (request) => ({ id: me.userId, user_metadata: request.body }),
  });
  await renderApp("/settings");

  const language = region(messages.en.settings.language.title);
  await userEvent.click(within(language).getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name: localeNames.hi }));

  expect(
    await screen.findByRole("heading", { level: 1, name: messages.hi.settings.title }),
  ).toBeTruthy();
  expect(document.documentElement.lang).toBe("hi");
  expect(localStorage.getItem("locale")).toBe("hi");
  await waitFor(() =>
    expect(requests).toContainEqual({
      method: "PUT",
      path: "/auth/v1/user",
      body: expect.objectContaining({ data: { locale: "hi" } }),
    }),
  );
});

describe("approximate date of birth", () => {
  const t = messages.en;

  test("an approximate date shows a note, and saving the exact date clears it", async () => {
    let profile = { ...selfProfile, dateOfBirth: "1986-01-01", dateOfBirthApproximate: true };
    const requests = fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [profile],
      [`PATCH /profiles/${selfProfile.id}`]: (request) => {
        profile = { ...profile, ...(request.body as object), dateOfBirthApproximate: false };
        return profile;
      },
    });
    await renderApp("/settings");

    const section = region(t.settings.profile.title);
    expect(await within(section).findByText(t.profiles.approximateBirthNote)).toBeTruthy();
    expect(within(section).getByText(t.profiles.approximate)).toBeTruthy();

    const date = within(section).getByLabelText(t.profiles.form.dateOfBirth, { exact: false });
    await userEvent.clear(date);
    await userEvent.type(date, "1986-04-12");
    await userEvent.click(within(section).getByRole("button", { name: t.profiles.self.save }));

    expect(await screen.findByText(t.profiles.self.saved)).toBeTruthy();
    expect(within(section).queryByText(t.profiles.approximateBirthNote)).toBeNull();
    expect(within(section).queryByText(t.profiles.approximate)).toBeNull();
    expect(requests).toContainEqual<SentRequest>({
      method: "PATCH",
      path: `/profiles/${selfProfile.id}`,
      body: { dateOfBirth: "1986-04-12", sex: "female", ancestry: "south_asian" },
    });
  });
});

test("a data download saves the JSON without the file links and lists each uploaded file", async () => {
  const t = messages.en;
  const saved: Blob[] = [];
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => saved.push(blob) && "blob:export",
    revokeObjectURL: () => {},
  });
  const file = { reportId: "r1", name: "Blood test.pdf", url: "https://storage.example/0.pdf" };
  const requests = fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /me/export": () => ({
      exportedAt: "2026-10-16T00:00:00.000Z",
      profiles: [],
      files: [file],
    }),
  });
  await renderApp("/settings");

  await userEvent.click(
    await within(region(t.settings.data.title)).findByRole("button", {
      name: t.settings.data.download,
    }),
  );

  const link = await screen.findByRole("link", { name: file.name });
  expect(link.getAttribute("href")).toBe(file.url);
  expect(screen.getByText(t.settings.data.filesExpire)).toBeTruthy();
  expect(requests).toContainEqual({ method: "GET", path: "/me/export?files=1", body: undefined });
  expect(JSON.parse(await saved[0]!.text())).toEqual({
    exportedAt: "2026-10-16T00:00:00.000Z",
    profiles: [],
  });
});

describe("delete account", () => {
  const t = messages.en;

  async function confirmDelete() {
    await userEvent.click(
      within(region(t.settings.data.title)).getByRole("button", { name: t.settings.data.delete }),
    );
    const dialog = await screen.findByRole("dialog", { name: t.settings.deleteDialog.title });
    const confirm = within(dialog).getByRole("button", { name: t.settings.data.delete });
    expect(confirm).toHaveProperty("disabled", true);
    await userEvent.type(
      within(dialog).getByLabelText(t.settings.deleteDialog.confirm("DELETE")),
      "DELETE",
    );
    await userEvent.click(confirm);
    return dialog;
  }

  test("a confirmed delete removes the account, signs the user out and opens sign-in", async () => {
    const requests = fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [selfProfile],
      "DELETE /me": () => new Response(null, { status: 204 }),
      "POST /auth/v1/logout": () => new Response(null, { status: 204 }),
    });
    await renderApp("/settings");
    await within(region(t.settings.identity.title)).findByRole("textbox", {
      name: t.settings.nameForm.name,
    });

    await confirmDelete();

    expect(await screen.findByText(t.settings.accountDeleted)).toBeTruthy();
    expect(await screen.findByRole("heading", { name: t.auth.login.title })).toBeTruthy();
    expect(requests).toContainEqual({ method: "DELETE", path: "/me", body: { confirm: "DELETE" } });
    expect(requests.some((r) => r.method === "POST" && r.path.startsWith("/auth/v1/logout"))).toBe(
      true,
    );
  });

  test("a failed delete keeps the dialog open with the API message and keeps the session", async () => {
    const message = "We deleted your data but not your sign-in. Try again.";
    const requests = fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [selfProfile],
      "DELETE /me": () => problem(502, message),
    });
    await renderApp("/settings");
    await within(region(t.settings.identity.title)).findByRole("textbox", {
      name: t.settings.nameForm.name,
    });

    const dialog = await confirmDelete();

    expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent", message);
    expect(screen.queryByText(t.settings.accountDeleted)).toBeNull();
    expect(requests.some((r) => r.path.startsWith("/auth/v1/logout"))).toBe(false);
  });
});

describe.each(["en", "hi"] as const)("about in %s", (locale) => {
  const t = messages[locale];

  test("the About section names the brand and the company and links the email and the four policies", async () => {
    fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    const about = await screen.findByRole("region", { name: t.settings.about.title });
    expect(within(about).getByText(t.settings.about.description("Codegenix"))).toBeTruthy();
    expect(within(about).getByText("Codegenix")).toBeTruthy();
    expect(
      within(about).getByRole("link", { name: "yashguptaab66@gmail.com" }).getAttribute("href"),
    ).toBe("mailto:yashguptaab66@gmail.com");
    for (const page of ["terms", "privacy", "refunds", "contact"] as const) {
      expect(
        within(about)
          .getByRole("link", { name: t.payments.policyLinks[page] })
          .getAttribute("href"),
      ).toBe(`/${page}`);
    }
  });
});
