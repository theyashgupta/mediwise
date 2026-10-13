import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const storageKey = "theme";
const listeners = new Set<() => void>();
let current: Theme | undefined;

/**
 * Reads the stored theme, falling back to the system preference.
 *
 * @remarks
 * Storage can throw in private windows, so a failure means "system".
 */
function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

/**
 * Persists the theme and applies it to the document root.
 *
 * @remarks
 * "system" removes `data-theme` so the `prefers-color-scheme` tokens in globals.css take over.
 * `index.html` applies the stored value before first paint with the same storage key.
 */
export function setTheme(theme: Theme) {
  current = theme;
  try {
    localStorage.setItem(storageKey, theme);
    // eslint-disable-next-line no-empty
  } catch {}
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

/**
 * Returns the active theme choice and a setter shared by every caller.
 */
export function useTheme() {
  const theme = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (current ??= readTheme()),
  );
  return { theme, setTheme };
}
