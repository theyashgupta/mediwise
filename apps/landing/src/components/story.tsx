"use client";

import { useRef, useState } from "react";
import { useIntersection } from "@/components/motion";
import { Phone, Screen, type ScreenName } from "@/components/phone";

export type Scene = { title: string; body: string; screen: ScreenName; alt: string };

function Step({
  scene,
  index,
  onActive,
}: {
  scene: Scene;
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useIntersection(ref, (inView) => inView && onActive(index), { rootMargin: "-45% 0px -45% 0px" });

  return (
    <li ref={ref} className="story-step py-10 last:pb-0 lg:py-12 lg:last:pb-0">
      <p className="font-mono text-sm text-primary">0{index + 1}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight">{scene.title}</h3>
      <p className="mt-3 max-w-md text-lg text-muted-foreground">{scene.body}</p>
      <Phone className="mx-auto mt-8 max-w-[260px] lg:hidden">
        <Screen name={scene.screen} alt={scene.alt} />
      </Phone>
    </li>
  );
}

export function Story({ scenes }: { scenes: Scene[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="story grid gap-x-16 lg:grid-cols-2">
      <ol>
        {scenes.map((scene, index) => (
          <Step key={scene.screen} scene={scene} index={index} onActive={setActive} />
        ))}
      </ol>
      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-[calc(50vh-19rem)]">
          <Phone className="mx-auto max-w-[300px]">
            {scenes.map((scene, index) => (
              <div
                key={scene.screen}
                data-on={index === active || undefined}
                className="story-screen absolute inset-0"
              >
                <Screen name={scene.screen} alt="" />
              </div>
            ))}
          </Phone>
        </div>
      </div>
    </div>
  );
}
