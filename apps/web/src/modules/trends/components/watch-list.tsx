import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { memo } from "react";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { formatDelta } from "@/modules/markers";
import { MarkerValue } from "@/modules/reports";
import { directionStyles } from "../config/trends";
import type { WatchItem } from "../types";

type WatchListProps = {
  items: WatchItem[];
};

const shownFirst = 5;
const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

function WatchRow({ item }: { item: WatchItem }) {
  const t = useT();
  const change =
    item.previous &&
    t.trends.watch.change(
      formatDelta(item.value, item.previous.value, item.precision),
      formatPlainDate(item.previous.date, dateOptions),
    );
  return (
    <Link
      to="/trends/$markerKey"
      params={{ markerKey: item.markerKey }}
      data-testid="watch-row"
      className="flex items-center gap-3 py-3 pr-3 pl-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <span
        className={cn("h-9 w-1 shrink-0 rounded-full", statusStyles[item.status].mark)}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-medium">{item.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {formatPlainDate(item.date, dateOptions)}
            {change && ` · ${change}`}
          </span>
          {item.direction === "worsening" && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
                directionStyles.worsening.badge,
              )}
            >
              {t.trends.direction.worsening}
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <MarkerValue
          value={item.value}
          valueText={null}
          unit={item.unit}
          precision={item.precision}
          className="text-sm"
        />
        <StatusBadge status={item.status} />
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function Rows({ items }: WatchListProps) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.markerKey}>
          <WatchRow item={item} />
        </li>
      ))}
    </ul>
  );
}

export const WatchList = memo(function WatchList({ items }: WatchListProps) {
  const t = useT();
  const rest = items.slice(shownFirst);
  return (
    <Section id="keep-an-eye" title={t.trends.watch.title} description={t.trends.watch.description}>
      {items.length === 0 ? (
        <p data-testid="watch-none" className="rounded-xl border bg-card p-4 text-muted-foreground">
          {t.trends.watch.none}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Rows items={items.slice(0, shownFirst)} />
          {rest.length > 0 && (
            <details className="group border-t">
              <summary
                data-testid="watch-more"
                className="cursor-pointer px-4 py-3 text-sm font-medium text-primary outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset group-open:border-b"
              >
                {t.trends.watch.more(rest.length)}
              </summary>
              <Rows items={rest} />
            </details>
          )}
        </div>
      )}
    </Section>
  );
});
