/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

/** Installs a fake `navigator.serviceWorker`, a fake reload and a fresh copy of the hook module. */
async function setup() {
  const container = Object.assign(new EventTarget(), { controller: {} as unknown });
  vi.stubGlobal("navigator", Object.assign(Object.create(navigator), { serviceWorker: container }));
  const reload = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload });
  const worker = { state: "installed", postMessage: vi.fn() };
  const hook = await import("./use-app-update");
  return { container, reload, worker, hook };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

test("a tap reloads the page when another tab already started the new build", async () => {
  const { container, reload, worker, hook } = await setup();
  hook.setWaitingWorker(worker as unknown as ServiceWorker);
  worker.state = "activated";
  container.controller = worker;

  hook.applyUpdate();

  expect(reload).toHaveBeenCalledOnce();
  expect(worker.postMessage).not.toHaveBeenCalled();
});

test("the update line goes away when any tab starts the new build", async () => {
  const { container, worker, hook } = await setup();
  const { result } = renderHook(() => hook.useUpdateAvailable());
  act(() => hook.setWaitingWorker(worker as unknown as ServiceWorker));
  expect(result.current).toBe(true);

  act(() => void container.dispatchEvent(new Event("controllerchange")));

  expect(result.current).toBe(false);
});
