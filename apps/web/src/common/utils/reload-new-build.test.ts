/** @vitest-environment jsdom */
import { afterEach, expect, test, vi } from "vitest";
import { reloadForNewBuild } from "./reload-new-build";

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

test("a code file that fails to load reloads the page once for each build", () => {
  const reload = vi.fn();
  vi.stubGlobal("location", { reload });

  reloadForNewBuild();
  reloadForNewBuild();
  expect(reload).toHaveBeenCalledTimes(1);

  sessionStorage.setItem("mediwise-reload", "https://app.example.test/assets/index-old.js");
  reloadForNewBuild();
  expect(reload).toHaveBeenCalledTimes(2);
});

test("a browser that blocks session storage gets no reload, so it cannot loop", () => {
  const reload = vi.fn();
  vi.stubGlobal("location", { reload });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });

  reloadForNewBuild();
  expect(reload).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
