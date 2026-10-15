import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { statusStyles } from "@/common/utils/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDelta } from "@/modules/markers";
import { MarkerValue, markerLink, studiesLink } from "@/modules/reports";
import { directionStyles } from "@/modules/trends";
import { type AttentionFilter, attentionFilters, matchesFilter } from "../config/attention-filter";
import type { AttentionItem } from "../types";
import { TrendsLink } from "./trends-link";

type AttentionListProps = {
  items: AttentionItem[];
};

const rowLink =
  "outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset";
const dateOptions = { day: "numeric", month: "short", year: "numeric" } as const;

function AttentionRow({ item }: { item: AttentionItem }) {
  const text = useT().dashboard.attention;
  const date = formatPlainDate(item.date, dateOptions);
  const detail =
    item.kind === "alert"
      ? text.study
      : item.previous &&
        text.change(
          formatDelta(item.value, item.previous.value, item.precision),
          formatPlainDate(item.previous.date, dateOptions),
        );
  return (
    <Link
      {...(item.kind === "marker"
        ? markerLink(item.reportId, item.markerKey)
        : studiesLink(item.reportId))}
      data-testid="attention-row"
      className={cn("flex items-center gap-3 py-3 pr-3 pl-4", rowLink)}
    >
      <span
        className={cn(
          "h-9 w-1 shrink-0 rounded-full",
          statusStyles[item.kind === "alert" ? "risk" : item.status].mark,
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-medium">{item.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span>
            {date}
            {detail && ` · ${detail}`}
          </span>
          {item.kind === "marker" && item.direction === "worsening" && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
                directionStyles.worsening.badge,
              )}
            >
              {text.worsening}
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {item.kind === "marker" && (
          <MarkerValue
            value={item.value}
            valueText={null}
            unit={item.unit}
            precision={item.precision}
            className="text-sm"
          />
        )}
        <StatusBadge status={item.kind === "alert" ? "risk" : item.status} />
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

export function AttentionList({ items }: AttentionListProps) {
  const text = useT().dashboard.attention;
  const [filter, setFilter] = useState<AttentionFilter>("all");
  const shown = items.filter((item) => matchesFilter(item, filter));
  return (
    <Section
      id="needs-attention"
      title={text.title}
      description={text.source}
      action={<TrendsLink />}
    >
      {items.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-muted-foreground">{text.none}</p>
      ) : (
        <div className="space-y-3">
          <div role="group" aria-label={text.filter} className="flex flex-wrap gap-2">
            {attentionFilters.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "secondary" : "ghost"}
                aria-pressed={filter === key}
                data-testid={`attention-filter-${key}`}
                onClick={() => setFilter(key)}
              >
                {text.filters[key]}
              </Button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-muted-foreground">
              {text.noneInFilter}
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {shown.map((item) => (
                <li key={`${item.kind}-${item.markerKey ?? item.name}`}>
                  <AttentionRow item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
