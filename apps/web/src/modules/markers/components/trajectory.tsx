import { ValueChart } from "@/common/components/value-chart";
import type { Status } from "@/common/utils/status";
import { formatDelta } from "../config/marker";
import type { Bounds } from "../types";

type TrajectoryPoint = {
  key: string;
  date: string;
  value: number;
  status: Status;
  current: boolean;
};

type TrajectoryProps = {
  points: TrajectoryPoint[];
  band: Bounds | null;
  unit?: string;
  precision: number;
};

export function Trajectory({ points, band, unit, precision }: TrajectoryProps) {
  if (points.length < 2) {
    return (
      <p className="rounded-xl border bg-card p-5 text-muted-foreground">
        This is the first value. The next report shows the direction of change.
      </p>
    );
  }
  const index = points.findIndex((point) => point.current);
  const current = points[index];
  const previous = points[index - 1];

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      {current && previous && (
        <p className="text-sm text-muted-foreground">
          <span className="font-mono font-medium text-foreground">
            {formatDelta(current.value, previous.value, precision)}
            {unit ? ` ${unit}` : ""}
          </span>{" "}
          since the report of {previous.date}.
        </p>
      )}
      <ValueChart
        points={points}
        band={band}
        bandLabel="Optimal range for this report"
        unit={unit}
        precision={precision}
      />
    </div>
  );
}
