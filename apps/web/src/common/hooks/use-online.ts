import { useSyncExternalStore } from "react";

/** Returns false while the browser has no network connection. */
export function useOnline() {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("online", listener);
      window.addEventListener("offline", listener);
      return () => {
        window.removeEventListener("online", listener);
        window.removeEventListener("offline", listener);
      };
    },
    () => navigator.onLine,
  );
}
