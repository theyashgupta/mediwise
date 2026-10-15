import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { StatusBadge } from "@/common/components/status-badge";
import { markerLink } from "../config/report";
import type { ReportDetail } from "../types";
import { MarkerValue } from "./marker-value";

type MoveFirstListProps = {
  reportId: string;
  items: ReportDetail["moveFirst"];
};

const shownFirst = 3;

function MoveFirstRow({
  reportId,
  item,
  rank,
}: {
  reportId: string;
  item: ReportDetail["moveFirst"][number];
  rank: number;
}) {
  return (
    <li>
      <Link
        {...markerLink(reportId, item.markerKey)}
        className="flex items-center gap-4 py-3 pr-4 pl-6 outline-none sm:pr-6 sm:pl-8 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium">
          {rank}
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
  );
}

export function MoveFirstList({ reportId, items }: MoveFirstListProps) {
  const t = useT();
  const rest = items.slice(shownFirst);
  return (
    <section aria-labelledby="move-first" className="space-y-1 border-t pt-5">
      <div className="space-y-1 px-6 sm:px-8">
        <h2 id="move-first" className="scroll-mt-28 text-xl font-semibold tracking-tight">
          {t.report.moveFirst.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.report.moveFirst.description}</p>
      </div>
      <ol className="divide-y">
        {items.slice(0, shownFirst).map((item, index) => (
          <MoveFirstRow key={item.markerKey} reportId={reportId} item={item} rank={index + 1} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="group/more border-t">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-8 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className="size-4 transition-transform duration-(--duration-fast) group-open/more:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
            {t.report.moveFirst.more(rest.length)}
          </summary>
          <ol className="divide-y border-t">
            {rest.map((item, index) => (
              <MoveFirstRow
                key={item.markerKey}
                reportId={reportId}
                item={item}
                rank={shownFirst + index + 1}
              />
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
