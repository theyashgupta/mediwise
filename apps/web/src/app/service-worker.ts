import { setWaitingWorker } from "@/common/hooks/use-app-update";

/**
 * Registers `/sw.js` after the page loads. The worker keeps the app shell for offline use and receives files that another app shares on Android.
 *
 * @remarks
 * The first install downloads the whole shell, so it waits until the page has its own files.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const register = () =>
    navigator.serviceWorker
      .register("/sw.js")
      .then(watchForUpdate)
      .catch(() => undefined);
  if (document.readyState === "complete") void register();
  else window.addEventListener("load", () => void register(), { once: true });
}

/**
 * Tells the page when a new build has installed beside the running one.
 *
 * @remarks
 * A worker that installs with no controller is the first install, not an update. An open single-page app makes no navigation that checks for a new build, so the check also runs each time the tab comes back into view.
 */
export function watchForUpdate(registration: ServiceWorkerRegistration) {
  const offer = (worker: ServiceWorker | null) => {
    if (worker && navigator.serviceWorker.controller) setWaitingWorker(worker);
  };
  offer(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") offer(worker);
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") registration.update().catch(() => undefined);
  });
}
