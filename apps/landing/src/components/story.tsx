"use client";

import { useEffect, useRef } from "react";
import { Phone, Screen, type ScreenName } from "@/components/phone";

export type Scene = { title: string; body: string; screen: ScreenName; alt: string };

/**
 * Returns the index of the last step that entered the centre line, or undefined when no step did.
 *
 * @remarks
 * Undefined keeps the current screen, so the gap between two steps never blanks the phone.
 */
export function centredStep(
  entries: Pick<IntersectionObserverEntry, "target" | "isIntersecting">[],
) {
  const entry = entries.findLast((item) => item.isIntersecting);
  return entry ? Number((entry.target as HTMLElement).dataset.storyStep) : undefined;
}

/**
 * Writes the index of the centred step to the story container as `data-step`.
 *
 * @remarks
 * The root margin shrinks the viewport to a thin band at its centre, so one observer serves every step.
 */
export function watchSteps(container: HTMLElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      const step = centredStep(entries);
      if (step !== undefined) container.dataset.step = String(step);
    },
    { rootMargin: "-49% 0px -49% 0px" },
  );
  for (const step of container.querySelectorAll("[data-story-step]")) observer.observe(step);
  return () => observer.disconnect();
}

export function Story({ scenes }: { scenes: Scene[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? watchSteps(ref.current) : undefined), []);

  return (
    <div ref={ref} data-step="0" className="story js:lg:grid js:lg:grid-cols-2 js:lg:gap-x-16">
      <ol className="js:lg:pt-[calc(50vh-3.5rem)] js:lg:pb-[50vh]">
        {scenes.map((scene, index) => (
          <li
            key={scene.screen}
            data-story-step={index}
            data-reveal=""
            className="py-10 js:lg:flex js:lg:min-h-[75vh] js:lg:flex-col js:lg:justify-center js:lg:py-0"
          >
            <p className="font-mono text-sm text-primary">0{index + 1}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">{scene.title}</h3>
            <p className="mt-3 max-w-md text-lg text-muted-foreground">{scene.body}</p>
            <p className="sr-only hidden js:lg:block">{scene.alt}</p>
            <Phone className="mx-auto mt-8 max-w-[260px] js:lg:hidden">
              <Screen name={scene.screen} alt={scene.alt} />
            </Phone>
          </li>
        ))}
      </ol>
      <div aria-hidden className="hidden js:lg:order-first js:lg:block">
        <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Phone className="story-phone">
            {scenes.map((scene, index) => (
              <div key={scene.screen} data-screen={index} className="story-screen absolute inset-0">
                <Screen name={scene.screen} alt="" />
              </div>
            ))}
          </Phone>
        </div>
      </div>
    </div>
  );
}
