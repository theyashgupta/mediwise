import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { ValueChart } from "@/common/components/value-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveProfile } from "@/modules/profiles";
import { formatReportDate } from "@/modules/reports";
import { ChangeLabel } from "../components/change-label";
import { TrendPoints } from "../components/trend-points";
import { directionStyles, displayUnit } from "../config/trends";
import { useTrend } from "../hooks/use-trends";

const route = getRouteApi("/_app/trends/$markerKey");

const backLink = (
  <Button asChild variant="outline">
    <Link to="/trends">
      <ArrowLeft aria-hidden />
      All trends
    </Link>
  </Button>
);

export function TrendContainer() {
  const { markerKey } = route.useParams();
  const { profile } = useActiveProfile();
  const trend = useTrend(profile?.id, markerKey);
  useCrumbLabel(`/trends/${markerKey}`, trend.data?.name);

  if (!profile || trend.isPending) return <LoadingState variant="page" />;
  if (trend.isError) {
    return <ErrorState message="We could not load this trend." onRetry={() => trend.refetch()} />;
  }
  if (!trend.data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No values for this marker"
        body="This profile has no report with this marker."
        action={backLink}
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
        description={`${points.length} ${points.length === 1 ? "value" : "values"} for ${profile.name}`}
        actions={backLink}
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
            <span className="text-muted-foreground">since the report before.</span>
            <span className={cn("rounded-md px-2 py-0.5 text-sm font-medium", style.badge)}>
              {style.label}
            </span>
          </p>
        )}
        <div className="rounded-xl border bg-card p-5">
          <ValueChart
            points={points.map((point) => ({
              key: point.reportId,
              date: point.date,
              value: point.value,
              status: point.status,
            }))}
            band={data.calibratedRange}
            bandLabel="Optimal range for your profile"
            unit={displayUnit(data.unit)}
            precision={data.precision}
          />
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
