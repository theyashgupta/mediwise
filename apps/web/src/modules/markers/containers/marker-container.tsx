import { getRouteApi, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { useT } from "@/common/hooks/use-locale";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { Section } from "@/common/components/section";
import { SourceList } from "@/common/components/source-list";
import { Button } from "@/components/ui/button";
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
  const t = useT();
  useCrumbLabel(`/reports/${reportId}`, query.data?.report.title);
  useCrumbLabel(
    `/reports/${reportId}/markers/${markerKey}`,
    query.data && (query.data.marker.shortName ?? query.data.marker.name),
  );

  if (query.isPending) return <LoadingState variant="page" />;
  if (query.isError) {
    return <ErrorState message={t.markers.page.loadError} onRetry={() => query.refetch()} />;
  }
  if (!query.data) {
    return (
      <EmptyState
        icon={FlaskConical}
        title={t.markers.page.missingTitle}
        body={t.markers.page.missingBody}
        action={
          <Button asChild variant="outline">
            <Link to="/reports/$reportId" params={{ reportId }}>
              {t.markers.page.openReport}
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
  const calibratedFor = [
    t.profiles.ancestry[profile.ancestry],
    sex && t.profiles.sex[sex].toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <MarkerHeader marker={marker} />
      <div className="space-y-12">
        {marker.value !== null && (
          <Section id="where-you-sit" title={t.markers.page.whereYouSit}>
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
        <Section id="trajectory" title={t.markers.page.trajectory}>
          <Trajectory
            points={history.map((point) => ({
              key: point.reportId,
              day: point.collectedAt ?? point.createdAt,
              date: formatReportDate(point.collectedAt, point.createdAt),
              value: point.value,
              status: point.status,
              current: point.reportId === report.id,
            }))}
            band={marker.calibratedRange}
            unit={unit}
            precision={marker.precision}
            today={new Date()}
          />
        </Section>
        <Section id="meaning" title={t.markers.page.meaning}>
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
        <Section id="knowledge" title={t.markers.page.knowledge}>
          <MarkerKnowledge knowledge={query.data.knowledge} />
        </Section>
        {showNote && (
          <Section id="calibration" title={t.markers.page.calibratedFor(calibratedFor)}>
            <p className="max-w-measure rounded-xl border bg-card p-5 leading-7">
              {query.data.southAsianNote}
            </p>
          </Section>
        )}
        <Section id="sources" title={t.markers.page.sources}>
          <SourceList sources={query.data.sources} />
        </Section>
        <MarkerNav reportId={reportId} previous={query.data.previous} next={query.data.next} />
      </div>
    </>
  );
}
