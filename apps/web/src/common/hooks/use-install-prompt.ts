import { useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const visitsKey = "visits";
const visitCountedKey = "visitCounted";
const listeners = new Set<() => void>();
let deferred: InstallPromptEvent | undefined;

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Counts this visit once per tab and keeps the browser install event for the Home banner.
 *
 * @remarks
 * Chrome fires `beforeinstallprompt` once, early in the page load, so the app listens at start and not when Home renders.
 */
export function listenForInstall() {
  try {
    if (!sessionStorage.getItem(visitCountedKey)) {
      sessionStorage.setItem(visitCountedKey, "1");
      localStorage.setItem(visitsKey, String(getVisits() + 1));
    }
    // eslint-disable-next-line no-empty
  } catch {}
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = undefined;
    notify();
  });
}

/** Returns how many times this browser opened the app, counted once per tab. */
export function getVisits() {
  try {
    return Number(localStorage.getItem(visitsKey)) || 0;
  } catch {
    return 0;
  }
}

/**
 * Shows the browser install dialog and returns true when the user installs the app.
 *
 * @remarks
 * The browser allows one `prompt()` per event, so the event is dropped after the call.
 */
export async function promptInstall() {
  const event = deferred;
  if (!event) return false;
  deferred = undefined;
  notify();
  await event.prompt();
  return (await event.userChoice).outcome === "accepted";
}

/** Returns true while the browser offers to install the app. */
export function useCanInstall() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => deferred !== undefined,
  );
}
