import { type Status, statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { sparklinePoints } from "../config/trends";

type SparklineProps = {
  values: number[];
  status: Status;
};

const width = 96;
const height = 28;

export function Sparkline({ values, status }: SparklineProps) {
  const points = sparklinePoints(values, width, height);
  const last = points.at(-1);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="stroke-chart-1"
      />
      {last && (
        <circle
          cx={last.x}
          cy={last.y}
          r="3.5"
          strokeWidth="1.5"
          className={cn("stroke-card", statusStyles[status].fill)}
        />
      )}
    </svg>
  );
}
