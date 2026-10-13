import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { CirclePause, FileDown, GitCompareArrows, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/common/hooks/use-locale";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { AfterFirstPaint } from "@/common/components/after-first-paint";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { GlassButton } from "@/common/components/surface/glass";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportEpisodeContainer } from "@/modules/episodes";
import { DeleteReportDialog } from "../components/delete-report-dialog";
import { DoctorQuestions } from "../components/doctor-questions";
import { FindingList } from "../components/finding-list";
import { FollowUpList } from "../components/follow-up-list";
import { MarkerSections } from "../components/marker-sections";
import { MoveFirstList } from "../components/move-first-list";
import { PatternList } from "../components/pattern-list";
import { ReportFailed } from "../components/report-failed";
import { ReportFiles } from "../components/report-files";
import { ReportNarrative } from "../components/report-narrative";
import { ReportLinks } from "../components/report-links";
import { ReportNote } from "../components/report-note";
import { ReportStatusBadge } from "../components/report-status-badge";
import { ReportSummary } from "../components/report-summary";
import { ReportTitle } from "../components/report-title";
import { SettledList } from "../components/settled-list";
import { StudyList } from "../components/study-list";
import { UnmeasuredList } from "../components/unmeasured-list";
import { formatReportDate } from "../config/report";
import { useReportLinks } from "../hooks/use-report-links";
import { useReportTranslation } from "../hooks/use-report-translation";
import { inProgress } from "../config/status";
import { useDeleteReport } from "../hooks/use-delete-report";
import { useReport, useReports } from "../hooks/use-reports";
import { useRetryReport } from "../hooks/use-retry-report";
import { useUpdateReportNote } from "../hooks/use-update-report-note";
import { useUpdateReportTitle } from "../hooks/use-update-report-title";
import type { MarkerFilter } from "../types";
import { SharedLinksContainer } from "./shared-links-container";
import { ShareReportContainer } from "./share-report-container";

const route = getRouteApi("/_app/reports/$reportId");

export function ReportContainer() {
  const { reportId } = route.useParams();
  const { show } = route.useSearch();
  const navigate = useNavigate();
  const t = useT();
  const report = useReport(reportId);
  useCrumbLabel(`/reports/${reportId}`, report.data?.header.title);
  const retry = useRetryReport();
  const remove = useDeleteReport();
  const saveNote = useUpdateReportNote();
  const saveTitle = useUpdateReportTitle();
  const links = useReportLinks();
  const siblings = useReports(report.data?.profileId);
  const translation = useReportTranslation(reportId, report.data?.translation);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (report.isPending) return <LoadingState variant="page" />;
  if (report.isError) {
    return <ErrorState message={t.report.loadError} onRetry={() => report.refetch()} />;
  }

  const { header, status } = report.data;
  const filter: MarkerFilter = show === "attention" ? "attention" : "all";
  const markerCount =
    report.data.categories.reduce((total, category) => total + category.markers.length, 0) +
    report.data.derived.length +
    report.data.unmapped.length;

  function setFilter(next: MarkerFilter) {
    void navigate({
      to: "/reports/$reportId",
      params: { reportId },
      search: next === "attention" ? { show: "attention" } : {},
      replace: true,
      resetScroll: false,
    });
  }

  function confirmDelete() {
    remove.mutate(reportId, {
      onSuccess: () => {
        toast.success(t.report.deleted);
        void navigate({ to: "/reports" });
      },
    });
  }

  const description = [
    (header.titleEdited || !header.title) &&
      formatReportDate(header.collectedAt, report.data.createdAt),
    report.data.labs.length > 0 && t.report.labs(report.data.labs),
  ]
    .filter(Boolean)
    .join(" · ");
  const title = header.title ?? t.report.title;

  return (
    <>
      <PageHeader
        title={title}
        heading={
          <ReportTitle
            key={`${reportId}:${title}`}
            title={title}
            edited={header.titleEdited}
            saving={saveTitle.isPending}
            failed={saveTitle.isError && saveTitle.variables.reportId === reportId}
            onSave={(next) => saveTitle.mutate({ reportId, title: next })}
          />
        }
        description={description}
        glass
        actions={
          <>
            {status !== "done" && (
              <span data-testid="report-status">
                <ReportStatusBadge status={status} />
              </span>
            )}
            {status === "done" && (
              <GlassButton asChild>
                <Link to="/compare" search={{ b: reportId }}>
                  <GitCompareArrows aria-hidden />
                  {t.report.compare}
                </Link>
              </GlassButton>
            )}
            {status === "done" && (
              <GlassButton asChild>
                <Link
                  to="/reports/$reportId/export"
                  params={{ reportId }}
                  target="_blank"
                  data-testid="report-export-link"
                >
                  <FileDown aria-hidden />
                  {t.report.export}
                </Link>
              </GlassButton>
            )}
            {status === "done" && <ShareReportContainer reportId={reportId} glass />}
            {status !== "processing" && (
              <Button
                variant="ghost"
                onClick={() => {
                  remove.reset();
                  setConfirmingDelete(true);
                }}
              >
                <Trash2 aria-hidden />
                {t.report.delete}
              </Button>
            )}
          </>
        }
      />
      {status === "paused" && (
        <p className="flex items-center gap-3 text-muted-foreground">
          <CirclePause className="size-5" aria-hidden />
          {t.report.paused}
        </p>
      )}
      {inProgress(status) && status !== "paused" && (
        <p className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          {t.report.reading}
        </p>
      )}
      {status === "failed" && (
        <ReportFailed
          message={report.data.error ?? t.report.readError}
          retrying={retry.isPending}
          retryError={retry.error?.message}
          onRetry={() => retry.mutate(reportId)}
        />
      )}
      {status === "done" && (
        <div className="space-y-12" data-testid="report-done">
          {(translation.translating || translation.failed) && (
            <p className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
              {translation.translating && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {translation.translating ? t.report.translation.writing : t.report.translation.failed}
            </p>
          )}
          {header.score !== null && <ReportSummary header={header} verdict={report.data.verdict} />}
          <AfterFirstPaint>
            <ReportLinks
              links={report.data.links}
              candidates={(siblings.data?.pages.flatMap((page) => page.items) ?? [])
                .filter(
                  (item) =>
                    item.status === "done" &&
                    item.id !== reportId &&
                    !report.data.links.some((link) => link.other.id === item.id),
                )
                .map((item) => ({
                  id: item.id,
                  label: item.title ?? formatReportDate(item.collectedAt, item.createdAt),
                }))}
              busy={links.link.isPending || links.update.isPending}
              failed={links.link.isError || links.update.isError}
              onUpdate={(linkId, state) => links.update.mutate({ reportId, linkId, state })}
              onLink={(otherId, kind) => links.link.mutate({ reportId, otherId, kind })}
            />
            <ReportEpisodeContainer reportId={reportId} profileId={report.data.profileId} />
            <ReportNote
              key={reportId}
              note={report.data.note}
              saving={saveNote.isPending}
              saved={saveNote.isSuccess && saveNote.variables.reportId === reportId}
              failed={saveNote.isError && saveNote.variables.reportId === reportId}
              onSave={(note) => saveNote.mutate({ reportId, note })}
            />
            <PatternList reportId={reportId} items={report.data.patterns} />
            <FindingList reportId={reportId} detail={report.data} />
            <SettledList items={report.data.settled} />
            <StudyList studies={report.data.studies} images={report.data.files.images} />
            <MoveFirstList reportId={reportId} items={report.data.moveFirst} />
            {report.data.narrative && (
              <ReportNarrative
                reportId={reportId}
                narrative={report.data.narrative}
                detail={report.data}
              />
            )}
            {markerCount > 0 && (
              <Tabs defaultValue="markers" className="gap-4">
                <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-fit">
                  <TabsTrigger value="markers" className="text-muted-foreground">
                    {t.report.tabs.markers(markerCount)}
                  </TabsTrigger>
                  <TabsTrigger value="follow-ups" className="text-muted-foreground">
                    {t.report.tabs.followUps(report.data.followUps.length)}
                  </TabsTrigger>
                  <TabsTrigger value="unmeasured" className="text-muted-foreground">
                    {t.report.tabs.unmeasured(report.data.unmeasured.length)}
                  </TabsTrigger>
                  <TabsTrigger value="doctor-questions" className="text-muted-foreground">
                    {t.report.tabs.doctorQuestions(report.data.doctorQuestions.length)}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="markers">
                  <MarkerSections
                    reportId={reportId}
                    detail={report.data}
                    filter={filter}
                    onFilterChange={setFilter}
                  />
                </TabsContent>
                <TabsContent value="follow-ups">
                  <FollowUpList items={report.data.followUps} />
                </TabsContent>
                <TabsContent value="unmeasured">
                  <UnmeasuredList items={report.data.unmeasured} />
                </TabsContent>
                <TabsContent value="doctor-questions">
                  <DoctorQuestions items={report.data.doctorQuestions} />
                </TabsContent>
              </Tabs>
            )}
          </AfterFirstPaint>
        </div>
      )}
      <AfterFirstPaint>
        {status === "done" && (
          <div className="mt-12">
            <SharedLinksContainer reportId={reportId} />
          </div>
        )}
        <ReportFiles files={report.data.files} className="mt-12" />
      </AfterFirstPaint>
      <DeleteReportDialog
        open={confirmingDelete}
        deleting={remove.isPending}
        error={remove.error?.message}
        onConfirm={confirmDelete}
        onOpenChange={setConfirmingDelete}
      />
    </>
  );
}
