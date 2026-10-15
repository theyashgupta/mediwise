import { useEffect, useState } from "react";

const minStep = 8;

/**
 * Returns true after the page scrolls down and false after it scrolls up or reaches the top.
 *
 * @remarks
 * Steps under 8 px are ignored, so a slow finger or an iOS bounce does not toggle it on each frame.
 * A step that comes with a new page height is the browser keeping the view in place, so it is ignored too.
 */
export function useScrollingDown() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let height = document.documentElement.scrollHeight;
    const onScroll = () => {
      const y = window.scrollY;
      const nextHeight = document.documentElement.scrollHeight;
      if (nextHeight !== height) {
        height = nextHeight;
        last = y;
        return;
      }
      if (y > 0 && Math.abs(y - last) < minStep) return;
      setDown(y > last && y > 0);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return down;
}
