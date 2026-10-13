import { useId } from "react";
import { formatRange, type Range, rangeScale } from "@/common/utils/range-scale";
import { type Status, statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { formatValue } from "../config/marker";
import type { Bounds, MarkerDetail } from "../types";

type WhereYouSitProps = {
  value: number;
  unit?: string;
  precision: number;
  status: Status;
  optimal: Bounds | null;
  watch: Bounds | null;
  lab: Bounds | null;
  source: MarkerDetail["calibratedSource"];
};

const toRange = (bounds: Bounds | null): Range | undefined =>
  bounds ? { low: bounds.low ?? undefined, high: bounds.high ?? undefined } : undefined;

const finite = (bounds: Bounds | null) =>
  bounds ? [bounds.low, bounds.high].filter((n): n is number => n !== null) : [];

function anchor(pct: number) {
  if (pct < 5) return "start";
  return pct > 95 ? "end" : "middle";
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-3 rounded-sm", className)} aria-hidden />
      {label}
    </span>
  );
}

export function WhereYouSit({
  value,
  unit,
  precision,
  status,
  optimal,
  watch,
  lab,
  source,
}: WhereYouSitProps) {
  const clipId = useId();
  const scale = rangeScale(value, toRange(lab), toRange(optimal), toRange(watch));
  const optimalBounds = finite(optimal);
  const watchBounds = finite(watch).filter((n) => !optimalBounds.includes(n));
  const label = [
    `Value ${formatValue(value, precision)}${unit ? ` ${unit}` : ""}, ${statusStyles[status].label}.`,
    optimal && `Optimal ${formatRange(toRange(optimal) ?? {}, unit)}.`,
    watch && `Watch ${formatRange(toRange(watch) ?? {}, unit)}.`,
    lab && `Lab range ${formatRange(toRange(lab) ?? {}, unit)}.`,
  ]
    .filter(Boolean)
    .join(" ");
  const text = (n: number, y: number) => (
    <text
      key={`${y}-${n}`}
      x={`${scale.pct(n)}%`}
      y={y}
      textAnchor={anchor(scale.pct(n))}
      className="fill-muted-foreground font-mono text-xs"
    >
      {formatValue(n, precision)}
    </text>
  );

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <svg role="img" aria-label={label} className="block h-24 w-full overflow-visible">
        {optimalBounds.map((n) => text(n, 12))}
        <clipPath id={clipId}>
          <rect y="20" width="100%" height="16" rx="8" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect y="20" width="100%" height="16" className={watch ? "fill-risk/25" : "fill-muted"} />
          {scale.watch && (
            <rect
              x={`${scale.watch.from}%`}
              width={`${scale.watch.to - scale.watch.from}%`}
              y="20"
              height="16"
              className="fill-watch/45"
            />
          )}
          {scale.calibrated && (
            <rect
              x={`${scale.calibrated.from}%`}
              width={`${scale.calibrated.to - scale.calibrated.from}%`}
              y="20"
              height="16"
              className="fill-optimal/55"
            />
          )}
        </g>
        <circle
          cx={`${scale.value}%`}
          cy="28"
          r="10"
          strokeWidth="3"
          className={cn("stroke-card", statusStyles[status].fill)}
        />
        {watchBounds.map((n) => text(n, 52))}
        {scale.lab && (
          <>
            <rect y="62" width="100%" height="6" rx="3" className="fill-muted" />
            <rect
              x={`${scale.lab.from}%`}
              width={`${scale.lab.to - scale.lab.from}%`}
              y="62"
              height="6"
              rx="3"
              className="fill-muted-foreground/40"
            />
            {finite(lab).map((n) => text(n, 86))}
          </>
        )}
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        {optimal && <Swatch className="bg-optimal/55" label="Optimal" />}
        {watch && <Swatch className="bg-watch/45" label="Watch" />}
        {watch && <Swatch className="bg-risk/25" label="Risk" />}
        {lab && <Swatch className="bg-muted-foreground/40" label="Lab range (thin bar)" />}
      </div>
      <p className="text-sm text-muted-foreground">
        {source ? (
          <>
            Calibrated range source:{" "}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                {source.title}
              </a>
            ) : (
              <span className="text-foreground">{source.title}</span>
            )}{" "}
            ({source.year}).
          </>
        ) : optimal ? (
          "No calibrated range applies to your profile. MediWise uses the lab range."
        ) : (
          "No range applies to your profile."
        )}
      </p>
    </div>
  );
}
