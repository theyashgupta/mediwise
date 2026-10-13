import { useState } from "react";

/**
 * Remembers in session storage that the user dismissed a prompt, until the tab closes.
 *
 * @remarks
 * Storage can throw in private windows, so a failure means "not dismissed" and the prompt shows again.
 */
export function useDismissedForSession(key: string) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });
  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(key, "1");
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return [dismissed, dismiss] as const;
}
