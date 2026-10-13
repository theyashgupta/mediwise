/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { listenForInstall } from "@/common/hooks/use-install-prompt";
import { useInstallOffer } from "./use-install-offer";

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
