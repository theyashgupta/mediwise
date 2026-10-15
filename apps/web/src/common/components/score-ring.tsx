import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  tier: string;
  size: "sm" | "md" | "lg";
  className?: string;
};

const radius = 52;
const circumference = 2 * Math.PI * radius;

const ringSizes = {
  sm: "w-12",
  md: "w-28 sm:w-36",
  lg: "w-36 sm:w-40",
};

export function ScoreRing({ score, tier, size, className }: ScoreRingProps) {
  const value = Math.round(Math.min(100, Math.max(0, score)));
  const t = useT();
  const tierInside = size !== "sm";
  return (
    <div
      role="img"
      aria-label={t.common.score.label(value, tier)}
      className={cn("flex max-w-full flex-col items-center gap-1", className)}
    >
      <div
        className={cn("@container relative aspect-square max-w-full", ringSizes[size])}
        data-testid="score-ring"
      >
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
          <span
            className="font-mono text-[24cqw] leading-none font-medium tracking-tight"
            data-testid="score-value"
          >
            {value}
          </span>
          {tierInside && (
            <span
              className="mt-1 text-[max(0.75rem,9cqw)] text-muted-foreground"
              data-testid="score-tier"
            >
              {tier}
            </span>
          )}
        </div>
      </div>
      {!tierInside && (
        <span className="text-xs text-muted-foreground" aria-hidden data-testid="score-tier">
          {tier}
        </span>
      )}
    </div>
  );
}
