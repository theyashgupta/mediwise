import type { CSSProperties } from "react";
import { PauseMotionButton } from "@/components/motion";
import { facts, marqueeRows } from "@/lib/facts";
import { cn } from "@/lib/utils";

const dots = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

type Group = ReturnType<typeof marqueeRows>[number][number];

function Track({
  groups,
  hidden,
  reverse,
}: {
  groups: Group[];
  hidden: boolean;
  reverse: boolean;
}) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      data-reverse={reverse || undefined}
      className="marquee-track flex shrink-0 gap-(--gap)"
    >
      {groups.flatMap((group) => [
        <li
          key={group.category}
          className="flex h-9 items-center px-1 font-mono text-xs tracking-wider whitespace-nowrap text-muted-foreground uppercase"
        >
          {group.label}
        </li>,
        ...group.names.map((name) => (
          <li
            key={`${group.category}-${name}`}
            className="flex h-9 items-center gap-2 rounded-full border bg-background px-3.5 text-sm whitespace-nowrap"
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", dots[group.colour])} />
            {name}
          </li>
        )),
      ])}
    </ul>
  );
}

export function MarkerMarquee() {
  return (
    <section aria-labelledby="markers-title" className="border-y bg-card py-12 md:py-16">
      <div className="mx-auto flex max-w-content flex-wrap items-end justify-between gap-4 px-4 md:px-8">
        <div>
          <h2 id="markers-title" className="text-xl font-semibold tracking-tight">
            {facts.markers} lab markers that MediWise knows
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            MediWise matches each printed test name to its catalog. A name it does not know shows as
            not recognised.
          </p>
        </div>
        <PauseMotionButton />
      </div>
      <div className="mt-8 flex flex-col gap-3">
        {marqueeRows().map((groups, index) => (
          <div
            key={index}
            className="marquee flex gap-(--gap) overflow-hidden"
            style={{ "--duration": `${90 + index * 15}s` } as CSSProperties}
          >
            <Track groups={groups} hidden={false} reverse={index === 1} />
            <Track groups={groups} hidden reverse={index === 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
