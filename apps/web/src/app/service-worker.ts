import { setWaitingWorker } from "@/common/hooks/use-app-update";

/**
 * Registers `/sw.js`, which keeps the app shell for offline use and receives files that another app shares on Android.
 *
 * @remarks
 * A registration failure only turns off the offline shell and sharing into the app, so it stays silent.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js")
    .then(watchForUpdate)
    .catch(() => undefined);
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
