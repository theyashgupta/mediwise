/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { installOffer, isIos, listenForInstall, useInstallOffer } from "./use-install-prompt";

/** Fires Chrome's install event with a fake dialog that answers with the given outcome. */
function offerInstall(outcome: "accepted" | "dismissed") {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => void window.dispatchEvent(event));
  return event;
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
});

listenForInstall();

test("Not now hides the banner and stores the date, so the next Home has no banner", () => {
  localStorage.setItem("visits", "2");
  offerInstall("dismissed");
  const first = renderHook(useInstallOffer);
  expect(first.result.current.offer).toBe("banner");

  act(() => first.result.current.dismiss());
  expect(first.result.current.offer).toBeUndefined();
  expect(Number(localStorage.getItem("installDismissedAt"))).toBeGreaterThan(0);

  offerInstall("dismissed");
  expect(renderHook(useInstallOffer).result.current.offer).toBeUndefined();
});

test("Install opens the browser dialog once and a refusal counts as a dismiss", async () => {
  localStorage.setItem("visits", "3");
  const event = offerInstall("dismissed");
  const { result } = renderHook(useInstallOffer);

  await act(() => result.current.install());
  expect(event.prompt).toHaveBeenCalledOnce();
  expect(event.defaultPrevented).toBe(true);
  expect(result.current.offer).toBeUndefined();
  expect(localStorage.getItem("installDismissedAt")).not.toBeNull();
});

const now = Date.parse("2026-10-14T10:00:00Z");
const day = 86_400_000;
const android = {
  visits: 2,
  now,
  dismissedAt: undefined,
  hintSeen: false,
  canInstall: true,
  ios: false,
  standalone: false,
};
const iphone = { ...android, canInstall: false, ios: true };

test("the first visit shows no install offer", () => {
  expect(installOffer({ ...android, visits: 1 })).toBeUndefined();
  expect(installOffer({ ...iphone, visits: 1 })).toBeUndefined();
});

test("from the second visit Android shows the banner while the browser offers an install", () => {
  expect(installOffer(android)).toBe("banner");
  expect(installOffer({ ...android, visits: 9 })).toBe("banner");
  expect(installOffer({ ...android, canInstall: false })).toBeUndefined();
});

test("a dismissed banner stays hidden for 30 days, then shows again", () => {
  expect(installOffer({ ...android, dismissedAt: now - 29 * day })).toBeUndefined();
  expect(installOffer({ ...android, dismissedAt: now - 30 * day })).toBe("banner");
});

test("iOS shows the hint sheet once", () => {
  expect(installOffer(iphone)).toBe("ios-hint");
  expect(installOffer({ ...iphone, hintSeen: true })).toBeUndefined();
});

test("the installed app shows no install offer", () => {
  expect(installOffer({ ...android, standalone: true })).toBeUndefined();
  expect(installOffer({ ...iphone, standalone: true })).toBeUndefined();
});

test("an iPhone and an iPad with a Mac user agent count as iOS, a Mac and Android do not", () => {
  expect(isIos("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
  expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
  expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
  expect(isIos("Mozilla/5.0 (Linux; Android 15; Pixel 9)", 5)).toBe(false);
});
