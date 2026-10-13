import { getRouteApi, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { Section } from "@/common/components/section";
import { SourceList } from "@/common/components/source-list";
import { Button } from "@/components/ui/button";
import { ancestryLabels, sexLabels } from "@/modules/profiles";
import { FollowUpList, formatReportDate } from "@/modules/reports";
import { MarkerHeader } from "../components/marker-header";
import { MarkerKnowledge } from "../components/marker-knowledge";
import { MarkerNav } from "../components/marker-nav";
import { Trajectory } from "../components/trajectory";
import { WhereYouSit } from "../components/where-you-sit";
import { statusSentence } from "../config/marker";
import { useMarker } from "../hooks/use-marker";

const route = getRouteApi("/_app/reports/$reportId_/markers/$markerKey");

export function MarkerContainer() {
  const { reportId, markerKey } = route.useParams();
  const query = useMarker(reportId, markerKey);
  useCrumbLabel(`/reports/${reportId}`, query.data?.report.labName);
  useCrumbLabel(
    `/reports/${reportId}/markers/${markerKey}`,
    query.data && (query.data.marker.shortName ?? query.data.marker.name),
  );

  if (query.isPending) return <LoadingState variant="page" />;
  if (query.isError) {
    return <ErrorState message="We could not load this marker." onRetry={() => query.refetch()} />;
  }
  if (!query.data) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="This marker is not in this report"
        body="Open the report to see the markers that it has."
        action={
          <Button asChild variant="outline">
            <Link to="/reports/$reportId" params={{ reportId }}>
              Open the report
            </Link>
          </Button>
        }
      />
    );
  }

  const { report, profile, marker, history } = query.data;
  const unit = marker.unit && marker.unit !== "ratio" ? marker.unit : undefined;
  const showNote = query.data.southAsianNote && profile.ancestry === "south_asian";
  const sex = profile.sex === "male" || profile.sex === "female" ? profile.sex : undefined;
  const calibratedFor = [ancestryLabels[profile.ancestry], sex && sexLabels[sex].toLowerCase()]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <MarkerHeader marker={marker} />
      <div className="space-y-12">
        {marker.value !== null && (
          <Section id="where-you-sit" title="Where you sit">
            <WhereYouSit
              value={marker.value}
              unit={unit}
              precision={marker.precision}
              status={marker.status}
              optimal={marker.calibratedRange}
              watch={query.data.watchRange}
              lab={marker.labRange}
              source={query.data.calibratedSource}
            />
          </Section>
        )}
        <Section id="trajectory" title="Trajectory">
          <Trajectory
            points={history.map((point) => ({
              key: point.reportId,
              date: formatReportDate(point.collectedAt, point.createdAt),
              value: point.value,
              status: point.status,
              current: point.reportId === report.id,
            }))}
            band={marker.calibratedRange}
            unit={unit}
            precision={marker.precision}
          />
        </Section>
        <Section id="meaning" title="What this means for you">
          <p className="max-w-measure text-lg text-balance">
            {statusSentence(
              marker.name,
              marker.status,
              marker.deviation,
              query.data.watchRange !== null,
            )}
          </p>
          {query.data.followUps.length > 0 && <FollowUpList items={query.data.followUps} />}
        </Section>
        <Section id="knowledge" title="The knowledge">
          <MarkerKnowledge knowledge={query.data.knowledge} />
        </Section>
        {showNote && (
          <Section id="calibration" title={`Calibrated for you, ${calibratedFor}`}>
            <p className="max-w-measure rounded-xl border bg-card p-5 leading-7">
              {query.data.southAsianNote}
            </p>
          </Section>
        )}
        <Section id="sources" title="Sources">
          <SourceList sources={query.data.sources} />
        </Section>
        <MarkerNav reportId={reportId} previous={query.data.previous} next={query.data.next} />
      </div>
    </>
  );
}
