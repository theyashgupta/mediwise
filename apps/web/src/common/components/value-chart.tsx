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
import { useState } from "react";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import { chartDomain } from "../utils/chart-domain";
import {
  type ChartRange,
  dayTime,
  defaultChartRange,
  isRecent,
  labelledIndexes,
  timeDomain,
} from "../utils/chart-window";
import { formatPlainDate } from "../utils/date";
import { type Status, statusStyles } from "../utils/status";
import { type LabInfo, ValueTooltip } from "./value-tooltip";

type ValuePoint = {
  key: string;
  day: string;
  date: string;
  value: number;
  status: Status;
  current?: boolean;
  linked?: boolean;
  lab?: LabInfo;
  sameDay?: { value: number; labName: string | null }[];
};

type ValueChartProps = {
  points: ValuePoint[];
  band: { low: number | null; high: number | null } | null;
  bandLabel: string;
  unit?: string;
  precision: number;
  today: Date;
};

type PlottedPoint = ValuePoint & { time: number; label: string };

const ranges: ChartRange[] = ["recent", "all"];

type DotProps = { cx?: number; cy?: number; payload?: PlottedPoint };

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
      {payload.linked && (
        <circle
          cx={cx}
          cy={cy}
          r={r + (payload.lab?.change ? 8 : 4)}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          className="fill-none stroke-foreground"
          data-testid="linked-point"
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

export function ValueChart({ points, band, bandLabel, unit, precision, today }: ValueChartProps) {
  const t = useT();
  const [range, setRange] = useState(() =>
    defaultChartRange(
      points.map((point) => point.day),
      today,
    ),
  );
  const config = {
    value: { label: t.common.chart.value, color: "var(--chart-1)" },
  } satisfies ChartConfig;
  const format = (n: number) =>
    n.toLocaleString(getIntlTag(), { maximumFractionDigits: precision });
  const recent = points.filter((point) => isRecent(point.day, today));
  const canZoom = recent.length >= 3 && recent.length < points.length;
  const shown = canZoom && range === "recent" ? recent : points;
  const times = shown.map((point) => dayTime(point.day));
  const labelled = labelledIndexes(times);
  const data: PlottedPoint[] = shown.map((point, index) => ({
    ...point,
    time: times[index]!,
    label: labelled.has(index) ? format(point.value) : "",
  }));
  const manyYears = new Set(shown.map((point) => point.day.slice(0, 4))).size > 1;
  const tick = (time: number) =>
    formatPlainDate(new Date(time).toISOString(), {
      day: "numeric",
      month: "short",
      ...(manyYears && { year: "2-digit" }),
    });
  const [low, high] = chartDomain(
    shown.map((point) => point.value),
    band,
  );
  const label = shown
    .map(
      (point) =>
        `${point.date}: ${format(point.value)}${unit ? ` ${unit}` : ""}${point.lab?.change ? ` (${t.common.chart.labChangedShort})` : ""}${point.linked ? ` (${t.common.chart.linkedShort})` : ""}`,
    )
    .join(", ");
  const hasBand = band && (band.low !== null || band.high !== null);
  const labChanges = data.filter((point) => point.lab?.change);
  const hasLinked = shown.some((point) => point.linked);

  return (
    <div className="space-y-3">
      {canZoom && (
        <div role="group" aria-label={t.common.chart.range} className="flex flex-wrap gap-2">
          {ranges.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={range === value ? "secondary" : "ghost"}
              aria-pressed={range === value}
              data-testid={`chart-range-${value}`}
              onClick={() => setRange(value)}
            >
              {t.common.chart.ranges[value]}
            </Button>
          ))}
        </div>
      )}
      <div role="img" aria-label={label} data-testid="value-chart">
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <LineChart
            data={data}
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
              dataKey="time"
              type="number"
              scale="time"
              domain={timeDomain(times)}
              ticks={times}
              interval="preserveStartEnd"
              minTickGap={16}
              tickFormatter={tick}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
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
                x={point.time}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
              />
            ))}
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as PlottedPoint | undefined;
                if (!active || !point) return null;
                return (
                  <ValueTooltip
                    date={point.date}
                    value={format(point.value)}
                    lab={point.lab}
                    sameDay={point.sameDay?.map((other) => ({
                      ...other,
                      value: format(other.value),
                    }))}
                    unit={unit}
                  />
                );
              }}
            />
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
                dataKey="label"
                position="top"
                offset={12}
                className="fill-foreground font-mono text-xs font-medium"
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </div>
      {(hasBand || labChanges.length > 0 || hasLinked) && (
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
              {t.common.chart.labChanged}
            </p>
          )}
          {hasLinked && (
            <p className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-[1.5px] border-dashed border-foreground" />
              {t.common.chart.linked}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
