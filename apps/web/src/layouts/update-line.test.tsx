/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { watchForUpdate } from "@/app/service-worker";
import { messages } from "@/config/messages";
import { UpdateLine } from "./update-line";

const text = messages.en.shell.update;

/** Installs a fake `navigator.serviceWorker` with or without a page controller. */
function fakeContainer(controlled: boolean) {
  const container = Object.assign(new EventTarget(), {
    controller: controlled ? {} : null,
  });
  vi.stubGlobal("navigator", Object.assign(Object.create(navigator), { serviceWorker: container }));
  return container;
}

/** Builds a registration whose `installing` worker finishes installing when `installed()` is called. */
function fakeRegistration() {
  const worker = Object.assign(new EventTarget(), {
    state: "installing",
    postMessage: vi.fn(),
  });
  const registration = Object.assign(new EventTarget(), {
    waiting: null,
    installing: worker,
    update: vi.fn(async () => undefined),
  });
  return {
    registration: registration as unknown as ServiceWorkerRegistration,
    worker,
    installed: () => {
      registration.dispatchEvent(new Event("updatefound"));
      worker.state = "installed";
      act(() => void worker.dispatchEvent(new Event("statechange")));
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("the first install of the worker shows no update line", () => {
  fakeContainer(false);
  const { registration, installed } = fakeRegistration();
  render(<UpdateLine />);
  watchForUpdate(registration);
  installed();

  expect(screen.queryByText(text.available)).toBeNull();
});

test("a new build shows the update line, and the page reloads only after the tap and the swap", async () => {
  const container = fakeContainer(true);
  const reload = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload });
  const { registration, worker, installed } = fakeRegistration();
  render(<UpdateLine />);
  watchForUpdate(registration);
  installed();

  expect(screen.getByRole("status")).toHaveProperty(
    "textContent",
    expect.stringContaining(text.available),
  );
  expect(worker.postMessage).not.toHaveBeenCalled();
  expect(reload).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: text.action }));
  expect(worker.postMessage).toHaveBeenCalledWith("skip-waiting");
  expect(reload).not.toHaveBeenCalled();

  container.dispatchEvent(new Event("controllerchange"));
  expect(reload).toHaveBeenCalledOnce();
});

test("the app checks for a new build when the tab comes back into view", () => {
  fakeContainer(true);
  const { registration } = fakeRegistration();
  watchForUpdate(registration);
  document.dispatchEvent(new Event("visibilitychange"));

  expect(registration.update).toHaveBeenCalled();
});
