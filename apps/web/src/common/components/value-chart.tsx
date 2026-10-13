import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { chartDomain } from "../utils/chart-domain";
import { type Status, statusStyles } from "../utils/status";
import { type LabInfo, ValueTooltip } from "./value-tooltip";

type ValuePoint = {
  key: string;
  date: string;
  value: number;
  status: Status;
  current?: boolean;
  lab?: LabInfo;
};

type ValueChartProps = {
  points: ValuePoint[];
  band: { low: number | null; high: number | null } | null;
  bandLabel: string;
  unit?: string;
  precision: number;
};

const config = { value: { label: "Value", color: "var(--chart-1)" } } satisfies ChartConfig;

type DotProps = { cx?: number; cy?: number; payload?: ValuePoint };

function StatusDot({ cx, cy, payload }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const r = payload.current ? 7 : 5;
  return (
    <g>
      {payload.lab?.change && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 4}
          strokeWidth="1.5"
          className="fill-none stroke-foreground"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth="2"
        className={cn("stroke-card", statusStyles[payload.status].fill)}
      />
    </g>
  );
}

export function ValueChart({ points, band, bandLabel, unit, precision }: ValueChartProps) {
  const format = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: precision });
  const [low, high] = chartDomain(
    points.map((point) => point.value),
    band,
  );
  const label = points
    .map(
      (point) =>
        `${point.date}: ${format(point.value)}${unit ? ` ${unit}` : ""}${point.lab?.change ? " (lab changed)" : ""}`,
    )
    .join(", ");
  const hasBand = band && (band.low !== null || band.high !== null);
  const hasLabs = points.some((point) => point.lab);
  const labChanges = points.filter((point) => point.lab?.change);

  return (
    <div className="space-y-3">
      <div role="img" aria-label={label}>
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <LineChart
            data={points}
            margin={{ top: 28, right: 20, bottom: 0, left: 4 }}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            {hasBand && (
              <ReferenceArea
                y1={band.low ?? low}
                y2={band.high ?? high}
                fill="var(--optimal)"
                fillOpacity={0.12}
                ifOverflow="hidden"
              />
            )}
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              padding={{ left: 24, right: 24 }}
            />
            <YAxis
              domain={[low, high]}
              tickLine={false}
              axisLine={false}
              width={48}
              tickCount={4}
              tickFormatter={format}
              className="font-mono"
            />
            {labChanges.map((point) => (
              <ReferenceLine
                key={point.key}
                x={point.date}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
            ))}
            {hasLabs && (
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as ValuePoint | undefined;
                  if (!active || !point?.lab) return null;
                  return (
                    <ValueTooltip
                      date={point.date}
                      value={format(point.value)}
                      lab={point.lab}
                      unit={unit}
                    />
                  );
                }}
              />
            )}
            <Line
              dataKey="value"
              type="linear"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={<StatusDot />}
              activeDot={false}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="top"
                offset={12}
                formatter={(value) => (typeof value === "number" ? format(value) : value)}
                className="fill-foreground font-mono text-xs font-medium"
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </div>
      {(hasBand || labChanges.length > 0) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          {hasBand && (
            <p className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-optimal/15" />
              {bandLabel}
            </p>
          )}
          {labChanges.length > 0 && (
            <p className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-[1.5px] border-foreground" />
              Lab changed at this result
            </p>
          )}
        </div>
      )}
    </div>
  );
}
