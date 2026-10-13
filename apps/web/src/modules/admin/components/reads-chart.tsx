import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatPlainDate } from "@/common/utils/date";
import { formatCents, formatCount } from "../config/admin";

type Day = { date: string; reads: number; costCents: number };

const config = { reads: { label: "Reads", color: "var(--chart-1)" } } satisfies ChartConfig;

const readsLabel = (reads: number) => `${formatCount(reads)} ${reads === 1 ? "read" : "reads"}`;

export function ReadsChart({ days }: { days: Day[] }) {
  const short = (date: string) => formatPlainDate(date, { day: "numeric", month: "short" });
  const label = days
    .filter((day) => day.reads > 0)
    .map((day) => `${short(day.date)}: ${readsLabel(day.reads)}, ${formatCents(day.costCents)}`)
    .join(", ");
  return (
    <div role="img" aria-label={label || "No reads in 30 days"} data-testid="admin-reads-chart">
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={short}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={({ active, payload }) => {
              const day = payload?.[0]?.payload as Day | undefined;
              if (!active || !day) return null;
              return (
                <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                  <p className="font-medium">{short(day.date)}</p>
                  <p className="font-mono">{readsLabel(day.reads)}</p>
                  <p className="font-mono">{formatCents(day.costCents)}</p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="reads"
            fill="var(--color-reads)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
