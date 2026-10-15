import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb, TrendingUp } from "lucide-react";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { ValueChart } from "@/common/components/value-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveProfile } from "@/modules/profiles";
import { formatReportDate } from "@/modules/reports";
import { ChangeLabel } from "../components/change-label";
import { LabNote } from "../components/lab-note";
import { TrendPoints } from "../components/trend-points";
import { directionStyles, displayUnit } from "../config/trends";
import { useTrend } from "../hooks/use-trends";

const route = getRouteApi("/_app/trends/$markerKey");

function BackLink() {
  const t = useT();
  return (
    <Button asChild variant="outline">
      <Link to="/trends">
        <ArrowLeft aria-hidden />
        {t.trends.detail.back}
      </Link>
    </Button>
  );
}

export function TrendContainer() {
  const { markerKey } = route.useParams();
  const { profile } = useActiveProfile();
  const trend = useTrend(profile?.id, markerKey);
  useCrumbLabel(`/trends/${markerKey}`, trend.data?.name);
  const t = useT();

  if (!profile || trend.isPending) return <LoadingState variant="page" />;
  if (trend.isError) {
    return <ErrorState message={t.trends.detail.loadError} onRetry={() => trend.refetch()} />;
  }
  if (!trend.data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={t.trends.detail.emptyTitle}
        body={t.trends.detail.emptyBody}
        action={<BackLink />}
      />
    );
  }

  const data = trend.data;
  const points = data.points.map((point) => ({
    ...point,
    date: formatReportDate(point.collectedAt, point.createdAt),
  }));
  const style = directionStyles[data.direction];
  return (
    <>
      <PageHeader
        title={data.name}
        description={t.trends.detail.values(points.length, profile.name)}
        actions={<BackLink />}
      />
      <div className="space-y-8">
        {data.change && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <ChangeLabel
              change={data.change}
              precision={data.precision}
              unit={data.unit}
              className={cn("text-base", style.text)}
            />
            <span className="text-muted-foreground">{t.trends.detail.sinceBefore}</span>
            <span className={cn("rounded-md px-2 py-0.5 text-sm font-medium", style.badge)}>
              {t.trends.direction[data.direction]}
            </span>
          </p>
        )}
        {data.suggestion && (
          <p
            data-testid="trend-detail-suggestion"
            className="flex gap-3 rounded-xl border bg-card p-4 text-sm"
          >
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="sr-only">{t.trends.suggestion}: </span>
              {data.suggestion}
            </span>
          </p>
        )}
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <ValueChart
            key={data.markerKey}
            points={points.map((point) => ({
              key: point.reportId,
              day: point.collectedAt ?? point.createdAt,
              date: point.date,
              value: point.value,
              status: point.status,
              linked: point.linked,
              episode: point.episode,
              lab: {
                name: point.labName,
                range: point.labRange,
                optimalRange: point.calibratedRange,
                change: point.labChange,
              },
              sameDay: point.sameDay,
            }))}
            band={data.calibratedRange}
            bandLabel={t.trends.detail.band}
            unit={displayUnit(data.unit)}
            precision={data.precision}
            today={new Date()}
          />
          <LabNote labCount={data.labCount} />
        </div>
        <TrendPoints
          markerKey={data.markerKey}
          category={data.category}
          points={points}
          unit={data.unit}
          precision={data.precision}
        />
      </div>
    </>
  );
}
