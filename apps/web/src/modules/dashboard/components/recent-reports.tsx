import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Section } from "@/common/components/section";
import { formatPlainDate } from "@/common/utils/date";
import { groupVisits, ReportStatusBadge } from "@/modules/reports";
import type { RecentReport } from "../types";

type RecentReportsProps = {
  reports: RecentReport[];
};

export function RecentReports({ reports }: RecentReportsProps) {
  return (
    <Section
      id="recent-reports"
      title="Recent visits"
      action={
        <Link
          to="/reports"
          className="rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          All reports
        </Link>
      }
    >
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {groupVisits(reports).map((visit) => (
          <li key={visit.key} className="divide-y divide-dashed">
            {visit.reports.map((report) => (
              <Link
                key={report.id}
                to="/reports/$reportId"
                params={{ reportId: report.id }}
                className="flex items-center gap-3 py-3 pr-3 pl-4 outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{report.labName ?? "Report"}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {formatPlainDate(report.date, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {report.fileNames.length > 0 && ` · ${report.fileNames.length} files`}
                  </span>
                </span>
                {report.status === "done" && report.score !== null ? (
                  <span className="shrink-0 text-right">
                    <span className="block font-mono font-medium">{report.score}</span>
                    <span className="block text-xs text-muted-foreground capitalize">
                      {report.tier}
                    </span>
                  </span>
                ) : (
                  <ReportStatusBadge status={report.status} />
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </li>
        ))}
      </ul>
    </Section>
  );
}
