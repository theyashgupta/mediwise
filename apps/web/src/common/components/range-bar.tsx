import { useId } from "react";
import { cn } from "@/lib/utils";
import { type Band, formatRange, type Range, rangeScale } from "../utils/range-scale";
import { type Status, statusStyles } from "../utils/status";

type RangeBarProps = {
  value: number;
  unit?: string;
  status: Status;
  labRange?: Range;
  calibratedRange?: Range;
  legend?: boolean;
};

function BandRect({ band, className }: { band: Band; className: string }) {
  return (
    <rect
      x={`${band.from}%`}
      width={`${band.to - band.from}%`}
      y="3"
      height="8"
      className={className}
    />
  );
}

export function RangeBar({
  value,
  unit,
  status,
  labRange,
  calibratedRange,
  legend = true,
}: RangeBarProps) {
  const clipId = useId();
  const scale = rangeScale(value, labRange, calibratedRange);
  const lab = labRange && scale.lab ? formatRange(labRange, unit) : undefined;
  const calibrated =
    calibratedRange && scale.calibrated ? formatRange(calibratedRange, unit) : undefined;
  const label = [
    `Value ${value}${unit ? ` ${unit}` : ""}, ${statusStyles[status].label}.`,
    lab && `Lab range ${lab}.`,
    calibrated && `Calibrated range ${calibrated}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2.5">
      <svg role="img" aria-label={label} className="block h-3.5 w-full overflow-visible">
        <clipPath id={clipId}>
          <rect y="3" width="100%" height="8" rx="4" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect y="3" width="100%" height="8" className="fill-muted" />
          {scale.lab && <BandRect band={scale.lab} className="fill-muted-foreground/25" />}
          {scale.calibrated && <BandRect band={scale.calibrated} className="fill-optimal/45" />}
        </g>
        <circle
          cx={`${scale.value}%`}
          cy="7"
          r="6"
          strokeWidth="2"
          className={cn("stroke-card", statusStyles[status].fill)}
        />
      </svg>
      {legend && (lab || calibrated) && (
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          {lab && (
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-muted-foreground/25" />
                Lab range
              </dt>
              <dd className="text-foreground">{lab}</dd>
            </div>
          )}
          {calibrated && (
            <div className="flex items-center gap-1.5">
              <dt className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-sm bg-optimal/45" />
                Calibrated range
              </dt>
              <dd className="text-foreground">{calibrated}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
