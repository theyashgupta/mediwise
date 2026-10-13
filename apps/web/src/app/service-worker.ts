/**
 * Registers `/sw.js`, which receives files that another app shares to MediWise on Android.
 *
 * @remarks
 * A registration failure only turns off sharing into the app, so it stays silent.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}
