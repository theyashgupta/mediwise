import type { ReactNode } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import type { MarkerFilter, MarkerRow as MarkerRowData, ReportDetail } from "../types";
import { MarkerRow } from "./marker-row";
import { MarkerValue } from "./marker-value";

type MarkerSectionsProps = {
  reportId: string;
  detail: Pick<ReportDetail, "categories" | "derived" | "unmapped">;
  filter: MarkerFilter;
  onFilterChange: (filter: MarkerFilter) => void;
};

const filters: MarkerFilter[] = ["all", "attention"];

type SectionProps = {
  id: string;
  title: string;
  count: number;
  labs?: string[];
  children: ReactNode;
};

function Section({ id, title, count, labs = [], children }: SectionProps) {
  const t = useT();
  return (
    <section aria-labelledby={`section-${id}`} className="space-y-2">
      <h3
        id={`section-${id}`}
        className="flex flex-wrap items-baseline gap-x-2 px-1 text-sm font-semibold"
      >
        {title}
        <span className="font-mono font-normal text-muted-foreground">{count}</span>
        {labs.length > 0 && (
          <span className="font-normal text-muted-foreground">{t.report.labs(labs)}</span>
        )}
      </h3>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">{children}</ul>
    </section>
  );
}

export function MarkerSections({ reportId, detail, filter, onFilterChange }: MarkerSectionsProps) {
  const t = useT();
  const visible = (rows: MarkerRowData[]) =>
    filter === "all" ? rows : rows.filter((row) => row.status === "watch" || row.status === "risk");
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

  return (
    <div className="space-y-6">
      <div className="sticky top-12 z-20 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur-md md:-mx-8 md:px-8">
        <div
          role="group"
          aria-label={t.report.markers.filterLabel}
          className="flex flex-wrap gap-1"
        >
          {filters.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "secondary" : "ghost"}
              aria-pressed={filter === value}
              onClick={() => onFilterChange(value)}
            >
              {t.report.markers.filters[value]}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-mono">{shown}</span> {t.report.markers.shown}
        </p>
      </div>
      {sections.length === 0 && !showUnmapped && (
        <p className="text-muted-foreground">{t.report.markers.noneInAttention}</p>
      )}
      {sections.map((section) => (
        <Section
          key={section.key}
          id={section.key}
          title={section.label}
          count={section.markers.length}
          labs={"labs" in section ? section.labs : undefined}
        >
          {section.markers.map((marker) => (
            <li key={marker.markerKey}>
              <MarkerRow reportId={reportId} marker={marker} />
            </li>
          ))}
        </Section>
      ))}
      {showUnmapped && (
        <Section id="unmapped" title={t.report.markers.unmapped} count={detail.unmapped.length}>
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
        </Section>
      )}
    </div>
  );
}
