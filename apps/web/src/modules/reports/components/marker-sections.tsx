import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/common/hooks/use-locale";
import type { Status } from "@/common/utils/status";
import { Button } from "@/components/ui/button";
import { markerFilters } from "../config/report";
import type { MarkerFilter, MarkerRow as MarkerRowData, ReportDetail } from "../types";
import { MarkerRow } from "./marker-row";
import { MarkerValue } from "./marker-value";
import { StatusCounts } from "./status-counts";

type MarkerSectionsProps = {
  reportId: string;
  detail: Pick<ReportDetail, "categories" | "derived" | "unmapped">;
  filter: MarkerFilter;
  onFilterChange: (filter: MarkerFilter) => void;
};

type GroupProps = {
  id: string;
  title: string;
  count: number;
  statuses: { status: Status }[];
  labs?: string[];
  open: boolean;
  children: ReactNode;
};

function Group({ id, title, count, statuses, labs = [], open, children }: GroupProps) {
  const t = useT();
  return (
    <details open={open} className="group/markers overflow-hidden rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 id={`section-${id}`} className="flex items-baseline gap-2 font-semibold">
            {title}
            <span className="font-mono text-sm font-normal text-muted-foreground">{count}</span>
          </h3>
          {labs.length > 0 && (
            <span className="text-sm text-muted-foreground">{t.report.labs(labs)}</span>
          )}
          <span className="flex flex-wrap gap-1.5">
            <StatusCounts items={statuses} />
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-open/markers:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <ul className="divide-y border-t">{children}</ul>
    </details>
  );
}

export function MarkerSections({ reportId, detail, filter, onFilterChange }: MarkerSectionsProps) {
  const t = useT();
  const visible = (rows: MarkerRowData[]) =>
    filter === "all" ? rows : rows.filter((row) => row.status === filter);
  const sections = [
    ...detail.categories.map(({ key, label, labNames, markers }) => ({
      key,
      label,
      labs: labNames,
      markers: visible(markers),
    })),
    { key: "ratios", label: t.report.markers.ratios, markers: visible(detail.derived) },
  ].filter((section) => section.markers.length > 0);
  const showUnmapped = filter === "all" && detail.unmapped.length > 0;
  const shown =
    sections.reduce((total, section) => total + section.markers.length, 0) +
    (showUnmapped ? detail.unmapped.length : 0);
  const open = filter !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label={t.report.markers.filterLabel}
          className="flex flex-wrap gap-1"
        >
          {markerFilters.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              aria-pressed={filter === value}
              data-testid={`marker-filter-${value}`}
              onClick={() => onFilterChange(value)}
            >
              {value === "all" ? t.report.markers.all : t.common.status[value]}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-mono">{shown}</span> {t.report.markers.shown}
        </p>
      </div>
      {sections.length === 0 && !showUnmapped && (
        <p className="text-muted-foreground">{t.report.markers.noneInFilter}</p>
      )}
      {sections.map((section) => (
        <Group
          key={`${section.key}:${filter}`}
          id={section.key}
          title={section.label}
          count={section.markers.length}
          statuses={section.markers}
          labs={"labs" in section ? section.labs : undefined}
          open={open}
        >
          {section.markers.map((marker) => (
            <li key={marker.markerKey}>
              <MarkerRow reportId={reportId} marker={marker} />
            </li>
          ))}
        </Group>
      ))}
      {showUnmapped && (
        <Group
          id="unmapped"
          title={t.report.markers.unmapped}
          count={detail.unmapped.length}
          statuses={[]}
          open={false}
        >
          {detail.unmapped.map((item, index) => (
            <li key={index} className="flex items-start justify-between gap-4 px-4 py-3">
              <span className="min-w-0 space-y-1">
                <span className="block font-medium break-words">{item.rawName}</span>
                <span className="block text-sm text-muted-foreground">
                  {t.report.markers.unmappedNote}
                </span>
              </span>
              <MarkerValue
                value={item.value}
                valueText={item.valueText}
                unit={item.unit}
                precision={3}
                className="max-w-[45%] text-right whitespace-normal"
              />
            </li>
          ))}
        </Group>
      )}
    </div>
  );
}
