import { Link } from "@tanstack/react-router";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { ScoreRing } from "@/common/components/score-ring";
import { formatReportDate } from "../config/report";
import { statusGroupOrder } from "../config/status";
import { groupVisits } from "../config/visits";
import type { ReportSummary } from "../types";
import { ReportStatusBadge } from "./report-status-badge";

type ReportListProps = {
  reports: ReportSummary[];
};

export function ReportList({ reports }: ReportListProps) {
  const t = useT();
  return (
    <div className="space-y-8">
      {statusGroupOrder.map((status) => {
        const group = reports.filter((report) => report.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} aria-labelledby={`reports-${status}`} className="space-y-3">
            <h2 id={`reports-${status}`} className="px-1 text-sm font-semibold">
              {t.report.status[status]}
            </h2>
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {groupVisits(group).map((visit) => (
                <li key={visit.key} className="divide-y divide-dashed">
                  {visit.reports.map((report) => (
                    <Link
                      key={report.id}
                      to="/reports/$reportId"
                      params={{ reportId: report.id }}
                      className="flex items-center gap-4 px-4 py-3 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                    >
                      {report.score !== null && report.tier ? (
                        <ScoreRing
                          score={report.score}
                          tier={t.report.summary.tiers[report.tier]}
                          className="size-12 shrink-0"
                        />
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          {(report.status === "queued" || report.status === "processing") && (
                            <LoaderCircle
                              className="size-5 animate-spin"
                              aria-label={t.reports.list.reading}
                            />
                          )}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {report.labName ?? t.reports.list.report}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {formatReportDate(report.collectedAt, report.createdAt)}
                          {report.markerCount > 0 &&
                            ` · ${t.report.markerCount(report.markerCount)}`}
                        </span>
                        {report.fileNames.length > 0 && (
                          <span className="block truncate text-sm text-muted-foreground">
                            {report.fileNames.join(", ")}
                          </span>
                        )}
                      </span>
                      <ReportStatusBadge status={report.status} />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
