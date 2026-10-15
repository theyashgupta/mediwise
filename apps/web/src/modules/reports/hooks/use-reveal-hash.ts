import { useEffect } from "react";

/**
 * Opens every fold around the element that the URL hash names, then scrolls to it.
 *
 * @remarks
 * Home, Trends and the assistant link to `#studies` or `#study-<id>`, and a target in a closed fold has no box to scroll to.
 */
export function useRevealHash(hash: string) {
  useEffect(() => {
    const target = hash ? document.getElementById(hash) : null;
    if (!target) return;
    for (
      let fold = target.closest("details");
      fold;
      fold = fold.parentElement?.closest("details") ?? null
    ) {
      fold.open = true;
    }
    target.scrollIntoView();
  }, [hash]);
}
