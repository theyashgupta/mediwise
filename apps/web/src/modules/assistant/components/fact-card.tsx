import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/common/components/status-badge";
import { useT } from "@/common/hooks/use-locale";
import { formatBounds } from "@/common/utils/range-scale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarkerDetail } from "@/modules/markers";
import { formatReportDate, MarkerValue } from "@/modules/reports";

type FactCardProps = {
  detail: MarkerDetail | null | undefined;
  pending: boolean;
};

export function FactCard({ detail, pending }: FactCardProps) {
  const { assistant, common } = useT();
  const t = assistant.fact;
  if (pending) return <Skeleton className="h-48 w-full" />;
  if (!detail) return <p className="text-muted-foreground">{t.missing}</p>;
  const { marker, report } = detail;
  const unit = marker.unit && marker.unit !== "ratio" ? marker.unit : undefined;
  return (
    <div data-testid="assistant-fact" className="space-y-4">
      <h2 className="text-lg font-medium">{marker.name}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <MarkerValue
          value={marker.value}
          valueText={marker.valueText}
          unit={marker.unit}
          precision={marker.precision}
          className="text-2xl"
        />
        <StatusBadge status={marker.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{common.range.lab}</dt>
        <dd>{formatBounds(marker.labRange, unit, t.none)}</dd>
        <dt className="text-muted-foreground">{common.range.calibrated}</dt>
        <dd>{formatBounds(marker.calibratedRange, unit, t.none)}</dd>
      </dl>
      <p className="text-sm text-muted-foreground">
        {[marker.labName ?? report.labName, formatReportDate(report.collectedAt, report.createdAt)]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <Button asChild variant="outline" className="min-h-11">
        <Link
          data-testid="assistant-fact-open"
          to="/reports/$reportId/markers/$markerKey"
          params={{ reportId: report.id, markerKey: marker.markerKey }}
        >
          {t.open}
        </Link>
      </Button>
    </div>
  );
}
