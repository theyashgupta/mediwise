"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { cn } from "@/lib/utils";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Calls back when the `data-motion` attribute on the root changes.
 *
 * @remarks
 * The attribute is the single source of truth, so CSS and the components below stop together.
 */
function subscribeToPause(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-motion"] });
  return () => observer.disconnect();
}

function subscribeToReducedMotion(onChange: () => void) {
  const query = matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Returns true when the visitor paused motion with the Pause motion button. */
export function useMotionPaused() {
  return useSyncExternalStore(
    subscribeToPause,
    () => document.documentElement.dataset.motion === "paused",
    () => false,
  );
}

/** Returns true when nothing may move: the visitor paused motion or the OS asks for reduced motion. */
export function useStill() {
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    () => matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  return useMotionPaused() || reduced;
}

/**
 * Calls `onChange` each time the element enters or leaves the viewport, shrunk by `rootMargin`.
 *
 * @remarks
 * `once` stops watching after the first entry, for reveals that must not run twice.
 */
export function useIntersection(
  ref: RefObject<Element | null>,
  onChange: (inView: boolean) => void,
  { rootMargin = "0px", once = false }: { rootMargin?: string; once?: boolean } = {},
) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        callback.current(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);
}

/**
 * Stores the visitor's choice and applies it to the root element.
 *
 * @remarks
 * The inline script in the layout reads the same `motion` key before the first paint.
 */
function setPaused(paused: boolean) {
  document.documentElement.dataset.motion = paused ? "paused" : "playing";
  try {
    localStorage.setItem("motion", paused ? "paused" : "playing");
  } catch {
    /** Private windows can block storage. The choice then lasts for this page view only. */
  }
}

export function PauseMotionButton({ label, className }: { label: string; className?: string }) {
  const paused = useMotionPaused();
  const Icon = paused ? Play : Pause;
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2",
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </button>
  );
}

/**
 * Writes a number the way the ticker shows it: en-IN digit grouping, fixed decimals, optional prefix.
 */
export function formatTicker(value: number, decimals: number, prefix = "") {
  return (
    prefix +
    value.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

/**
 * Counts the element's text from zero to the value over 1.2 seconds, easing out.
 *
 * @remarks
 * The cleanup writes the final value, so a pause in the middle of the count leaves the true number.
 */
function countUp(element: HTMLElement, value: number, format: (value: number) => string) {
  const duration = 1200;
  let start: number | undefined;
  let frame = requestAnimationFrame(function step(now) {
    start ??= now;
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = format(value * (1 - (1 - progress) ** 3));
    if (progress < 1) frame = requestAnimationFrame(step);
  });
  return () => {
    cancelAnimationFrame(frame);
    element.textContent = format(value);
  };
}

export function NumberTicker({
  value,
  decimals = 0,
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const still = useStill();
  const final = formatTicker(value, decimals, prefix);
  useIntersection(ref, (entered) => entered && setInView(true), { once: true });

  useEffect(() => {
    const element = ref.current;
    if (!element || still || !inView) return;
    return countUp(element, value, (latest) => formatTicker(latest, decimals, prefix));
  }, [still, inView, value, decimals, prefix]);

  return (
    <span
      ref={ref}
      className={cn("inline-block font-mono tabular-nums", className)}
      style={{ minWidth: `${final.length}ch` }}
    >
      {final}
    </span>
  );
}
