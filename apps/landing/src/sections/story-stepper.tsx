"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStill } from "@/components/motion";
import { Phone, Screen, type ScreenName } from "@/components/phone";
import { cn } from "@/lib/utils";

export type StoryStep = {
  label: string;
  title: string;
  body: string;
  screen: ScreenName;
  alt: string;
};

export const stepMs = 4500;

/**
 * Moves to the next step after `stepMs`, from the last step back to the first, and returns the cancel.
 */
export function scheduleNext(active: number, count: number, go: (step: number) => void) {
  const timer = setTimeout(() => go((active + 1) % count), stepMs);
  return () => clearTimeout(timer);
}

export function StoryStepper({ steps }: { steps: StoryStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ active, turns }, setState] = useState({ active: 0, turns: 0 });
  const [inView, setInView] = useState(false);
  const still = useStill();
  const running = inView && !still;
  const go = useCallback(
    (step: number) =>
      setState((state) =>
        step === state.active ? state : { active: step, turns: state.turns + 1 },
      ),
    [],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => (running ? scheduleNext(active, steps.length, go) : undefined),
    [running, active, steps.length, go],
  );

  return (
    <div
      ref={ref}
      className="mt-10 grid items-center gap-8 lg:mt-14 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16"
    >
      <div className="mx-auto w-full max-w-[220px] perspective-distant lg:max-w-none">
        <div className="story-phone" data-turn={turns ? turns % 2 : undefined}>
          <Phone>
            {steps.map((step, index) => (
              <Screen
                key={step.screen}
                name={step.screen}
                alt={step.alt}
                loading={index ? "lazy" : "eager"}
                className={cn("story-screen", index !== active && "opacity-0")}
              />
            ))}
          </Phone>
        </div>
      </div>
      <ol className="space-y-1">
        {steps.map((step, index) => (
          <li key={step.screen}>
            <button
              type="button"
              aria-current={index === active ? "step" : undefined}
              onClick={() => go(index)}
              className="relative w-full overflow-hidden rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-card focus-visible:outline-2 aria-[current]:bg-card aria-[current]:ring-1 aria-[current]:ring-border"
            >
              <span className="block font-mono text-xs text-primary">{step.label}</span>
              <span className="mt-0.5 block font-semibold tracking-tight lg:text-lg">
                {step.title}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground lg:text-base">
                {step.body}
              </span>
              {running && index === active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
                  style={{ animation: `grow-x ${stepMs}ms linear` }}
                />
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
