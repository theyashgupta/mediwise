import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import { MarkerValue } from "@/modules/reports";
import { directionStyles } from "../config/trends";
import type { TrendItem } from "../types";
import { ChangeLabel } from "./change-label";
import { Sparkline } from "./sparkline";

type TrendListProps = {
  items: TrendItem[];
};

const columns =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_6rem_10rem_13rem]";

export const TrendList = memo(function TrendList({ items }: TrendListProps) {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div
        aria-hidden
        className={cn(
          columns,
          "hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid",
        )}
      >
        <span>{t.trends.columns.marker}</span>
        <span>{t.trends.columns.trend}</span>
        <span className="text-right">{t.trends.columns.latest}</span>
        <span className="text-right">{t.trends.columns.lastChange}</span>
      </div>
      <ul className="divide-y">
        {items.map((item) => {
          const latest = item.points.at(-1);
          const style = directionStyles[item.direction];
          return (
            <li
              key={item.markerKey}
              className={cn(
                "[content-visibility:auto] sm:[contain-intrinsic-size:auto_5rem]",
                item.suggestion
                  ? "[contain-intrinsic-size:auto_10rem]"
                  : "[contain-intrinsic-size:auto_6rem]",
              )}
            >
              <Link
                to="/trends/$markerKey"
                params={{ markerKey: item.markerKey }}
                className={cn(
                  columns,
                  "px-4 py-3 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
                )}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium break-words">{item.name}</span>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", style.badge)}>
                    {t.trends.direction[item.direction]}
                  </span>
                </span>
                <Sparkline
                  values={item.points.map((point) => point.value)}
                  status={item.latestStatus}
                />
                <MarkerValue
                  value={latest?.value ?? null}
                  valueText={null}
                  unit={item.unit}
                  precision={item.precision}
                  className="text-sm whitespace-normal sm:text-right"
                />
                <ChangeLabel
                  change={item.change}
                  precision={item.precision}
                  unit={item.unit}
                  className={cn("justify-end whitespace-normal text-right", style.text)}
                />
                {item.suggestion && (
                  <span
                    data-testid="trend-suggestion"
                    className="col-span-full text-sm text-muted-foreground"
                  >
                    {item.suggestion}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
