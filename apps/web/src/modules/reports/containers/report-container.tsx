import { getRouteApi, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  CirclePause,
  FileDown,
  GitCompareArrows,
  LoaderCircle,
  MessagesSquare,
  Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/common/hooks/use-locale";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { AfterFirstPaint } from "@/common/components/after-first-paint";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { StatusBadge } from "@/common/components/status-badge";
import { GlassButton } from "@/common/components/surface/glass";
import { IconAction, OverflowMenu } from "@/common/components/icon-action";
import type { Status } from "@/common/utils/status";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ReportEpisodeContainer } from "@/modules/episodes";
import { useMe } from "@/modules/me";
import { useActiveProfile } from "@/modules/profiles";
import { DeleteReportDialog } from "../components/delete-report-dialog";
import { DoctorQuestions } from "../components/doctor-questions";
import { FindingList } from "../components/finding-list";
import { FoldSection, type FoldSectionProps } from "../components/fold-section";
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
import { SectionNav } from "../components/section-nav";
import { SettledList } from "../components/settled-list";
import { StatusCounts } from "../components/status-counts";
import { StudyList } from "../components/study-list";
import { UnmeasuredList } from "../components/unmeasured-list";
import { formatReportDate } from "../config/report";
import { maxFindingCards } from "../config/findings";
import { alertStudyIds } from "../config/studies";
import { useOpenSections } from "../hooks/use-open-sections";
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

type Fold = Pick<FoldSectionProps, "id" | "title" | "count" | "summary" | "description"> & {
  defaultOpen?: boolean;
  shown: boolean;
  content: ReactNode;
};

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
  const assistantOn = useMe().data?.assistant.enabled ?? false;
  const { setActiveProfileId } = useActiveProfile();
  const profileId = report.data?.profileId;
  const translation = useReportTranslation(reportId, report.data?.translation);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const sections = useOpenSections();
  const hash = useLocation({ select: (location) => location.hash });

  if (report.isPending) return <LoadingState variant="page" />;
  if (report.isError) {
    return <ErrorState message={t.report.loadError} onRetry={() => report.refetch()} />;
  }

  const detail = report.data;
  const { header, status } = detail;
  const filter: MarkerFilter = show ?? "all";
  const scored = [...detail.categories.flatMap((category) => category.markers), ...detail.derived];
  const markerCount = scored.length + detail.unmapped.length;
  const alertIds = alertStudyIds(detail.findings);
  const findings = detail.findings.slice(0, maxFindingCards);
  const linkCandidates = (siblings.data?.pages.flatMap((page) => page.items) ?? [])
    .filter(
      (item) =>
        item.status === "done" &&
        item.id !== reportId &&
        !detail.links.some((link) => link.other.id === item.id),
    )
    .map((item) => ({
      id: item.id,
      label: item.title ?? formatReportDate(item.collectedAt, item.createdAt),
    }));
  const severities = (items: { severity: Status }[]) =>
    items.map((item) => ({ status: item.severity }));
  const folds: Fold[] = [
    {
      id: "findings",
      title: t.report.findings.title,
      description: t.report.findings.description,
      count: findings.length,
      summary: <StatusCounts items={severities(findings)} />,
      defaultOpen: true,
      shown: detail.findings.length > 0,
      content: <FindingList reportId={reportId} detail={detail} />,
    },
    {
      id: "studies",
      title: t.report.studies.title,
      description: t.report.studies.description,
      count: detail.studies.length + detail.files.images.length,
      summary: alertIds.size > 0 && <StatusBadge status="risk" count={alertIds.size} />,
      shown: detail.studies.length + detail.files.images.length > 0,
      content: (
        <StudyList studies={detail.studies} images={detail.files.images} alertIds={alertIds} />
      ),
    },
    {
      id: "markers",
      title: t.report.sections.markers,
      count: markerCount,
      summary: <StatusCounts items={scored} only={["risk", "watch"]} />,
      shown: markerCount > 0,
      content: (
        <MarkerSections
          reportId={reportId}
          detail={detail}
          filter={filter}
          onFilterChange={setFilter}
        />
      ),
    },
    {
      id: "patterns",
      title: t.report.patterns.title,
      description: t.report.patterns.description,
      count: detail.patterns.length,
      summary: <StatusCounts items={severities(detail.patterns)} />,
      shown: detail.patterns.length > 0,
      content: <PatternList reportId={reportId} items={detail.patterns} />,
    },
    {
      id: "narrative",
      title: t.report.narrative.title,
      summary: detail.narrative?.sections.find((section) => section.sentences.length > 0)
        ?.sentences[0]?.text,
      shown: detail.narrative !== null,
      content: detail.narrative && (
        <ReportNarrative reportId={reportId} narrative={detail.narrative} detail={detail} />
      ),
    },
    {
      id: "follow-ups",
      title: t.report.sections.followUps,
      count: detail.followUps.length,
      summary: detail.followUps[0]?.title,
      shown: markerCount + detail.followUps.length > 0,
      content: <FollowUpList items={detail.followUps} />,
    },
    {
      id: "doctor-questions",
      title: t.report.sections.doctorQuestions,
      count: detail.doctorQuestions.length,
      summary: detail.doctorQuestions[0],
      shown: markerCount + detail.doctorQuestions.length > 0,
      content: <DoctorQuestions items={detail.doctorQuestions} />,
    },
    {
      id: "unmeasured",
      title: t.report.sections.unmeasured,
      count: detail.unmeasured.length,
      summary: detail.unmeasured.map((item) => item.name).join(", "),
      shown: markerCount + detail.unmeasured.length > 0,
      content: <UnmeasuredList items={detail.unmeasured} />,
    },
    {
      id: "settled",
      title: t.report.settled.title,
      description: t.report.settled.description,
      count: detail.settled.length,
      summary: detail.settled[0]?.title,
      shown: detail.settled.length > 0,
      content: <SettledList items={detail.settled} />,
    },
    {
      id: "links",
      title: t.report.links.title,
      description: t.report.links.description,
      count: detail.links.length || undefined,
      defaultOpen: detail.links.length > 0,
      shown: detail.links.length + linkCandidates.length > 0,
      content: (
        <ReportLinks
          links={detail.links}
          candidates={linkCandidates}
          busy={links.link.isPending || links.update.isPending}
          failed={links.link.isError || links.update.isError}
          onUpdate={(linkId, state) => links.update.mutate({ reportId, linkId, state })}
          onLink={(otherId, kind) => links.link.mutate({ reportId, otherId, kind })}
        />
      ),
    },
    {
      id: "note",
      title: t.report.note.label,
      summary: detail.note ?? undefined,
      shown: true,
      content: (
        <ReportNote
          key={reportId}
          note={detail.note}
          saving={saveNote.isPending}
          saved={saveNote.isSuccess && saveNote.variables.reportId === reportId}
          failed={saveNote.isError && saveNote.variables.reportId === reportId}
          onSave={(note) => saveNote.mutate({ reportId, note })}
        />
      ),
    },
  ].filter((fold) => fold.shown);

  function setFilter(next: MarkerFilter) {
    void navigate({
      to: "/reports/$reportId",
      params: { reportId },
      search: next === "all" ? {} : { show: next },
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
        tools={
          <>
            {status === "done" && (
              <IconAction label={t.report.compare} asChild>
                <Link to="/compare" search={{ b: reportId }} data-testid="report-compare-link">
                  <GitCompareArrows aria-hidden />
                </Link>
              </IconAction>
            )}
            {status === "done" && (
              <IconAction label={t.report.export} asChild>
                <Link
                  to="/reports/$reportId/export"
                  params={{ reportId }}
                  target="_blank"
                  data-testid="report-export-link"
                >
                  <FileDown aria-hidden />
                </Link>
              </IconAction>
            )}
            {status === "done" && <ShareReportContainer reportId={reportId} />}
            {status !== "processing" && (
              <OverflowMenu>
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-11 md:min-h-8"
                  data-testid="report-delete"
                  onSelect={() => {
                    remove.reset();
                    setConfirmingDelete(true);
                  }}
                >
                  <Trash2 aria-hidden />
                  {t.report.delete}
                </DropdownMenuItem>
              </OverflowMenu>
            )}
          </>
        }
        actions={
          <>
            {status !== "done" && (
              <span data-testid="report-status">
                <ReportStatusBadge status={status} />
              </span>
            )}
            {status === "done" && assistantOn && (
              <GlassButton asChild className="h-auto min-h-9 max-w-full py-1.5 whitespace-normal">
                <Link
                  to="/ask"
                  search={{ report: reportId }}
                  data-testid="report-ask-link"
                  onClick={() => profileId && setActiveProfileId(profileId)}
                >
                  <MessagesSquare aria-hidden />
                  {t.assistant.askReport}
                </Link>
              </GlassButton>
            )}
          </>
        }
      />
      {header.dateAmbiguous && (
        <p
          className="flex items-start gap-3 text-sm text-muted-foreground"
          data-testid="report-date-ambiguous"
        >
          <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t.report.dateAmbiguous}
        </p>
      )}
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
        <div className="space-y-8" data-testid="report-done">
          {(translation.translating || translation.failed) && (
            <p className="flex items-center gap-3 text-sm text-muted-foreground" role="status">
              {translation.translating && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              )}
              {translation.translating ? t.report.translation.writing : t.report.translation.failed}
            </p>
          )}
          {(header.score !== null || detail.moveFirst.length > 0) && (
            <div className="overflow-hidden rounded-xl border bg-card">
              {header.score !== null && <ReportSummary header={header} verdict={detail.verdict} />}
              {detail.moveFirst.length > 0 && (
                <MoveFirstList reportId={reportId} items={detail.moveFirst} />
              )}
            </div>
          )}
          <AfterFirstPaint>
            <SectionNav hash={hash} sections={folds} />
            <div className="border-b">
              {folds.map((fold) => (
                <FoldSection
                  key={fold.id}
                  id={fold.id}
                  title={fold.title}
                  count={fold.count}
                  summary={fold.summary}
                  description={fold.description}
                  open={sections.isOpen(fold.id, fold.defaultOpen ?? false)}
                  onOpenChange={(open) => sections.setOpen(fold.id, open)}
                >
                  {fold.content}
                </FoldSection>
              ))}
            </div>
            <ReportEpisodeContainer reportId={reportId} profileId={detail.profileId} />
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
