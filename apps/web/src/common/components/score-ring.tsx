import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  tier: string;
  className?: string;
};

const radius = 52;
const circumference = 2 * Math.PI * radius;

export function ScoreRing({ score, tier, className }: ScoreRingProps) {
  const value = Math.round(Math.min(100, Math.max(0, score)));
  return (
    <div
      role="img"
      aria-label={`Score ${value} out of 100, ${tier}`}
      className={cn("@container relative size-40", className)}
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
        <span className="mt-1 text-[max(0.75rem,9cqw)] text-muted-foreground">{tier}</span>
      </div>
    </div>
  );
}
