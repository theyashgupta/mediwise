import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let waiting: ServiceWorker | undefined;

/** Marks a new build as installed and waiting for the user to start it. */
export function setWaitingWorker(worker: ServiceWorker) {
  waiting = worker;
  listeners.forEach((listener) => listener());
  navigator.serviceWorker.addEventListener("controllerchange", clearWaitingWorker, { once: true });
}

/**
 * Removes the update line when a new build takes control of the page.
 *
 * @remarks
 * The swap reaches every open tab, also the tabs that did not tap Update.
 */
function clearWaitingWorker() {
  waiting = undefined;
  listeners.forEach((listener) => listener());
}

/**
 * Starts the waiting build and reloads the page when it takes control.
 *
 * @remarks
 * Only a tap calls this, so a new build never replaces the page in the middle of a form. When another tab already started the build, the page only reloads.
 */
export function applyUpdate() {
  if (!waiting) return;
  if (waiting === navigator.serviceWorker.controller || waiting.state === "activated") {
    window.location.reload();
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
    once: true,
  });
  waiting.postMessage("skip-waiting");
}

/** Returns true when a new build waits for the user to start it. */
export function useUpdateAvailable() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => waiting !== undefined,
  );
}
