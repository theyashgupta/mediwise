import { useEffect, useState } from "react";

const minStep = 8;

/**
 * Returns true after the page scrolls down and false after it scrolls up or reaches the top.
 *
 * @remarks
 * Steps under 8 px are ignored, so a slow finger or an iOS bounce does not toggle it on each frame.
 */
export function useScrollingDown() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 0 && Math.abs(y - last) < minStep) return;
      setDown(y > last && y > 0);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return down;
}
