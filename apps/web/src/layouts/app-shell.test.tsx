/** @vitest-environment jsdom */
import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, me, renderApp, resetApp, selfProfile } from "@/test/render-app";

afterEach(() => {
  vi.restoreAllMocks();
  resetApp();
});

describe.each(["en", "hi"] as const)("the shell in %s", (locale) => {
  const t = messages[locale];

  test("offline, the shell shows the offline state and no page content", async () => {
    const onLine = vi.spyOn(Navigator.prototype, "onLine", "get").mockReturnValue(false);
    fakeNetwork({ "GET /me": () => me, "GET /profiles": () => [selfProfile] });
    await renderApp("/settings", { locale });

    expect(await screen.findByRole("heading", { name: t.shell.offline.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: t.settings.title })).toBeNull();

    onLine.mockReturnValue(true);
    act(() => void window.dispatchEvent(new Event("online")));
    expect(await screen.findByRole("heading", { level: 1, name: t.settings.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: t.shell.offline.title })).toBeNull();
  });
});
