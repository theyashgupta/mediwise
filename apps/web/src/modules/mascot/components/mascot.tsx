import { cn } from "@/lib/utils";

export type MascotState = "idle" | "listening" | "thinking" | "talking";

const drop = "M16 3s-9.1 9.88-9.1 16.9a9.1 9.1 0 0 0 18.2 0c0-7.02-9.1-16.9-9.1-16.9Z";
const ease = "motion-safe:transition-all motion-safe:duration-(--duration-slow) ease-standard";

const poses = {
  idle: {
    figure: "motion-safe:animate-mascot-breathe",
    eyes: "motion-safe:animate-mascot-blink",
    smile: "",
    open: "opacity-0",
  },
  listening: {
    figure: "-translate-x-[0.8px] -rotate-8",
    eyes: "scale-112 motion-safe:animate-mascot-blink",
    smile: "opacity-0",
    open: "scale-55",
  },
  thinking: {
    figure: "motion-safe:animate-mascot-bob",
    eyes: "translate-x-[1.2px] -translate-y-[1.4px] motion-safe:animate-mascot-look",
    smile: "translate-x-[1.2px] scale-x-55",
    open: "opacity-0",
  },
  talking: {
    figure: "",
    eyes: "motion-safe:animate-mascot-blink",
    smile: "opacity-0",
    open: "motion-safe:animate-mascot-talk",
  },
} satisfies Record<MascotState, Record<"figure" | "eyes" | "smile" | "open", string>>;

type MascotProps = {
  state?: MascotState;
  size?: number;
  className?: string;
};

export function Mascot({ state = "idle", size = 48, className }: MascotProps) {
  const pose = poses[state];
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      data-state={state}
      className={cn("shrink-0 overflow-visible motion-safe:animate-mascot-enter", className)}
    >
      <g className={cn("origin-bottom transform-fill", ease, pose.figure)}>
        <path
          d={drop}
          className="fill-(--ambient-1) stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d="M10.4 16.4q.5-2.6 2.3-5"
          className="fill-none stroke-primary"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <g className={cn("origin-center transform-fill fill-foreground", ease, pose.eyes)}>
          <circle cx="13" cy="19" r="1.5" />
          <circle cx="19" cy="19" r="1.5" />
        </g>
        <path
          d="M14.1 22.6q1.9 1.2 3.8 0"
          className={cn(
            "origin-center transform-fill fill-none stroke-foreground",
            ease,
            pose.smile,
          )}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <ellipse
          cx="16"
          cy="23"
          rx="1.8"
          ry="1.4"
          className={cn("origin-center transform-fill fill-foreground", ease, pose.open)}
        />
      </g>
    </svg>
  );
}
