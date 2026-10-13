import { useSyncExternalStore } from "react";

const query = "(width >= 80rem)";

/**
 * Tells whether the window is at the Tailwind `xl` width or wider, where the fact card gets its own column.
 *
 * @remarks
 * The query is in rem like Tailwind's `xl`, so a larger browser font moves both breakpoints together.
 */
export function useWideScreen() {
  return useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    () => window.matchMedia(query).matches,
  );
}
