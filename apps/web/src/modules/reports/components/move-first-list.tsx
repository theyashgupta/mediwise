import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Section } from "@/common/components/section";
import { StatusBadge } from "@/common/components/status-badge";
import { markerLink } from "../config/report";
import type { ReportDetail } from "../types";
import { MarkerValue } from "./marker-value";

type MoveFirstListProps = {
  reportId: string;
  items: ReportDetail["moveFirst"];
};

export function MoveFirstList({ reportId, items }: MoveFirstListProps) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <Section
      id="move-first"
      title={t.report.moveFirst.title}
      description={t.report.moveFirst.description}
    >
      <ol className="divide-y overflow-hidden rounded-xl border bg-card">
        {items.map((item, index) => (
          <li key={item.markerKey}>
            <Link
              {...markerLink(reportId, item.markerKey)}
              className="flex items-center gap-4 py-3 pr-3 pl-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.name}</span>
                <span className="block text-sm text-muted-foreground">{item.description}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <MarkerValue
                  value={item.value}
                  valueText={item.valueText}
                  unit={item.unit}
                  precision={item.precision}
                />
                <StatusBadge status={item.status} />
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </Section>
  );
}
