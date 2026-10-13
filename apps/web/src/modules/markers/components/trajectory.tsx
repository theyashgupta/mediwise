import { ValueChart } from "@/common/components/value-chart";
import { useT } from "@/common/hooks/use-locale";
import type { Status } from "@/common/utils/status";
import { formatDelta } from "../config/marker";
import type { Bounds } from "../types";

type TrajectoryPoint = {
  key: string;
  day: string;
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
  today: Date;
};

export function Trajectory({ points, band, unit, precision, today }: TrajectoryProps) {
  const t = useT();
  if (points.length < 2) {
    return (
      <p className="rounded-xl border bg-card p-5 text-muted-foreground">
        {t.markers.trajectory.first}
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
          {t.markers.trajectory.since(previous.date)}
        </p>
      )}
      <ValueChart
        points={points}
        band={band}
        bandLabel={t.markers.trajectory.band}
        unit={unit}
        precision={precision}
        today={today}
      />
    </div>
  );
}
