import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { MarkerValue } from "@/modules/reports";
import type { NewSinceReport } from "../types";

type NewSinceStripProps = {
  since: string;
  reports: NewSinceReport[];
};

export function NewSinceStrip({ since, reports }: NewSinceStripProps) {
  const text = useT().dashboard.newSince;
  const sinceDate = formatPlainDate(since, { day: "numeric", month: "short", year: "numeric" });
  return (
    <section aria-labelledby="new-since" className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 id="new-since" className="font-semibold">
          {text.title(sinceDate)}
        </h2>
        <p className="text-sm text-muted-foreground">{text.body(sinceDate)}</p>
      </div>
      <ul className="divide-y overflow-hidden rounded-lg border bg-background">
        {reports.map((report) => (
          <li key={report.id}>
            <Link
              to="/reports/$reportId"
              params={{ reportId: report.id }}
              className="flex items-center gap-x-3 px-3 py-2.5 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0 text-sm text-muted-foreground sm:w-14">
                  {formatPlainDate(report.date, { day: "numeric", month: "short" })}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5">
                  {report.markers.map((marker) => (
                    <span
                      key={`${marker.markerKey}-${marker.name}`}
                      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
                    >
                      <span className="truncate text-sm font-medium">{marker.name}</span>
                      {marker.value !== null && (
                        <MarkerValue
                          value={marker.value}
                          valueText={null}
                          unit={marker.unit}
                          precision={2}
                          className="text-sm"
                        />
                      )}
                      {marker.status && <StatusBadge status={marker.status} />}
                    </span>
                  ))}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
