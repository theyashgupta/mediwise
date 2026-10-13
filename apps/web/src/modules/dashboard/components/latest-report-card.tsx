import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { ScoreRing } from "@/common/components/score-ring";
import { StatTile } from "@/common/components/surface/stat-tile";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { statusStyles } from "@/common/utils/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scoreChange } from "../config/score-change";
import type { LatestReport } from "../types";

type LatestReportCardProps = {
  report: LatestReport;
};

const statuses = ["optimal", "watch", "risk"] as const;

function meter(counts: LatestReport["counts"], total: number) {
  let from = 0;
  return statuses
    .filter((status) => counts[status] > 0)
    .map((status) => {
      const width = (counts[status] / total) * 100;
      const segment = { status, from, width: Math.max(width - 0.6, 0.6) };
      from += width;
      return segment;
    });
}

function ScoreChange({
  delta,
  latestDate,
}: {
  delta: NonNullable<LatestReport["deltaSincePrevious"]>;
  latestDate: string;
}) {
  const t = useT();
  const change = scoreChange(delta, latestDate);
  const Arrow = delta.score > 0 ? ArrowUpRight : delta.score < 0 ? ArrowDownRight : ArrowRight;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1" data-testid="latest-score-change">
      <span
        className={cn(
          "inline-flex items-center gap-1 self-center rounded-md px-2 py-0.5 font-mono text-sm font-medium",
          statusStyles[change.status].badge,
        )}
      >
        <Arrow className="size-3.5" aria-hidden />
        {change.value}
      </span>
      <span className="text-sm text-muted-foreground">
        {t.dashboard.latest.since(change.since)}
      </span>
    </p>
  );
}

export function LatestReportCard({ report }: LatestReportCardProps) {
  const t = useT();
  const text = t.dashboard.latest;
  const date = formatPlainDate(report.date, { day: "numeric", month: "short", year: "numeric" });
  const total = statuses.reduce((sum, status) => sum + report.counts[status], 0);
  return (
    <section
      aria-labelledby="latest-report"
      className="grid gap-6 rounded-xl border bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-8"
    >
      {report.score !== null && report.tier && (
        <ScoreRing score={report.score} tier={t.report.summary.tiers[report.tier]} size="lg" />
      )}
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {date}
            {report.coverage !== null && ` · ${text.coverage(report.coverage)}`}
          </p>
          <h2 id="latest-report" className="text-2xl font-semibold tracking-tight text-balance">
            {report.labName ?? text.fallbackTitle}
          </h2>
          {report.deltaSincePrevious && (
            <ScoreChange delta={report.deltaSincePrevious} latestDate={report.date} />
          )}
        </div>
        {total > 0 && (
          <div className="space-y-3">
            <svg className="block h-2 w-full" aria-hidden>
              {meter(report.counts, total).map(({ status, from, width }) => (
                <rect
                  key={status}
                  x={`${from}%`}
                  width={`${width}%`}
                  height="100%"
                  rx="3"
                  className={statusStyles[status].fill}
                />
              ))}
            </svg>
            <dl className="grid grid-cols-3 gap-2 sm:max-w-md" aria-label={text.byStatus}>
              {statuses.map((status) => (
                <StatTile
                  key={status}
                  label={t.common.status[status]}
                  value={report.counts[status]}
                  status={status}
                  className="bg-background px-3 py-2"
                />
              ))}
            </dl>
          </div>
        )}
        <Button asChild>
          <Link to="/reports/$reportId" params={{ reportId: report.id }}>
            {text.open}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
