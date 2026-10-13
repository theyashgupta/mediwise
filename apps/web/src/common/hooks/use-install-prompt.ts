import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const visitsKey = "visits";
const dismissedKey = "installDismissedAt";
const hintSeenKey = "installHintSeen";
const visitCountedKey = "visitCounted";
const dismissDays = 30;
const dayMs = 86_400_000;
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
function getVisits() {
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
async function promptInstall() {
  const event = deferred;
  if (!event) return false;
  deferred = undefined;
  notify();
  await event.prompt();
  return (await event.userChoice).outcome === "accepted";
}

/** Returns true while the browser offers to install the app. */
function useCanInstall() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => deferred !== undefined,
  );
}

export type InstallOffer = "banner" | "ios-hint" | undefined;

type InstallState = {
  visits: number;
  now: number;
  dismissedAt: number | undefined;
  hintSeen: boolean;
  canInstall: boolean;
  ios: boolean;
  standalone: boolean;
};

/**
 * Picks the install offer for Home: the Android banner, the one-time iOS hint, or nothing.
 *
 * @remarks
 * Both wait for the second visit, so a new user sees the app before we ask them to install it.
 */
export function installOffer(state: InstallState): InstallOffer {
  if (state.standalone || state.visits < 2) return undefined;
  if (state.canInstall) {
    const dismissed =
      state.dismissedAt !== undefined && state.now - state.dismissedAt < dismissDays * dayMs;
    return dismissed ? undefined : "banner";
  }
  return state.ios && !state.hintSeen ? "ios-hint" : undefined;
}

/**
 * Returns true on an iPhone or an iPad.
 *
 * @remarks
 * iPadOS Safari reports a Mac user agent, so a Mac with a touch screen counts as an iPad.
 */
export function isIos(userAgent: string, maxTouchPoints: number) {
  return (
    /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && maxTouchPoints > 1)
  );
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    // eslint-disable-next-line no-empty
  } catch {}
}

/** Reads the stored install state and the time once, when Home opens. */
function readInstallState() {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return {
    now: Date.now(),
    visits: getVisits(),
    dismissedAt: Number(read(dismissedKey)) || undefined,
    hintSeen: read(hintSeenKey) === "1",
    ios: isIos(navigator.userAgent, navigator.maxTouchPoints),
    standalone,
  };
}

/**
 * Returns the install offer for Home and the actions that close it.
 *
 * @remarks
 * The iOS hint counts as seen when it opens, so it shows once even when the user leaves it open.
 */
export function useInstallOffer() {
  const canInstall = useCanInstall();
  const [stored] = useState(readInstallState);
  const [closed, setClosed] = useState(false);
  const offer = closed ? undefined : installOffer({ ...stored, canInstall });

  useEffect(() => {
    if (offer === "ios-hint") write(hintSeenKey, "1");
  }, [offer]);

  const dismiss = () => {
    write(dismissedKey, String(Date.now()));
    setClosed(true);
  };
  const install = async () => {
    setClosed(true);
    if (!(await promptInstall())) write(dismissedKey, String(Date.now()));
  };
  return { offer, install, dismiss, close: () => setClosed(true) };
}
