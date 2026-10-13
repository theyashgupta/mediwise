import { Link } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { downloadFile } from "@/common/utils/download";
import { Button } from "@/components/ui/button";
import { EpisodeCardContainer } from "@/modules/episodes";
import { ConsentPromptContainer, useActiveProfile } from "@/modules/profiles";
import { ReportFailed, useRetryReport } from "@/modules/reports";
import { YearReviewCardContainer } from "@/modules/year-review";
import { AttentionList } from "../components/attention-list";
import { DashboardGreeting } from "../components/dashboard-greeting";
import { FamilyList } from "../components/family-list";
import { InstallBanner } from "../components/install-banner";
import { InstallHintSheet } from "../components/install-hint-sheet";
import { LatestReportCard } from "../components/latest-report-card";
import { NewSinceStrip } from "../components/new-since-strip";
import { ProcessingCard } from "../components/processing-card";
import { ProfilePrompt } from "../components/profile-prompt";
import { RecentReports } from "../components/recent-reports";
import { RetestList } from "../components/retest-list";
import { buildRetestCalendarFile } from "../config/calendar-file";
import { isMeasuredRecently } from "../config/report-age";
import { useDashboard } from "../hooks/use-dashboard";
import { useDismissedForSession } from "../hooks/use-dismissed-for-session";
import { useFamily } from "../hooks/use-family";
import { useInstallOffer } from "@/common/hooks/use-install-prompt";
import type { RetestDate } from "../types";

function UploadButton() {
  const t = useT();
  return (
    <Button asChild>
      <Link to="/reports/upload">
        <Upload aria-hidden />
        {t.dashboard.upload}
      </Link>
    </Button>
  );
}

export function DashboardContainer() {
  const text = useT().dashboard;
  const { profile, setActiveProfileId } = useActiveProfile();
  const dashboard = useDashboard(profile?.id);
  const family = useFamily();
  const retry = useRetryReport();
  const install = useInstallOffer();
  const data = dashboard.data;
  const isEmpty = data?.recent.length === 0;
  const lastFailed = data?.recent[0]?.status === "failed" ? data.recent[0] : undefined;
  const [birthPromptDismissed, dismissBirthPrompt] = useDismissedForSession(
    "approximateBirthPromptDismissed",
  );
  const incomplete = profile && (!profile.dateOfBirth || !profile.sex);

  const retests = data?.retests.filter(
    (retest) => !isMeasuredRecently(retest.measuredOn, new Date()),
  );
  const addToCalendar = (marker: RetestDate) => {
    if (!profile) return;
    const file = buildRetestCalendarFile({ profile, marker }, new Date());
    downloadFile(
      new Blob([file], { type: "text/calendar;charset=utf-8" }),
      `retest-${marker.markerKey}-${marker.dueOn}.ics`,
    );
  };

  return (
    <>
      <DashboardGreeting firstName={profile?.name.split(" ")[0]} now={new Date()} />
      <div className="space-y-10">
        <ConsentPromptContainer />
        {install.offer === "banner" && (
          <InstallBanner onInstall={() => void install.install()} onDismiss={install.dismiss} />
        )}
        <InstallHintSheet open={install.offer === "ios-hint"} onClose={install.close} />
        {profile && incomplete && (
          <ProfilePrompt
            title={text.incomplete.title(profile.name)}
            body={text.incomplete.body}
            action={text.incomplete.action}
            to="/profiles"
          />
        )}
        {profile && !incomplete && profile.dateOfBirthApproximate && !birthPromptDismissed && (
          <ProfilePrompt
            title={text.approximateBirth.title(profile.name)}
            body={text.approximateBirth.body}
            action={text.approximateBirth.action}
            to={profile.isSelf ? "/settings" : "/profiles"}
            onAction={dismissBirthPrompt}
          />
        )}
        {(!profile || dashboard.isPending) && <LoadingState variant="page" />}
        {dashboard.isError && (
          <ErrorState message={text.loadError} onRetry={() => dashboard.refetch()} />
        )}
        {data && data.processingCount > 0 && <ProcessingCard count={data.processingCount} />}
        {lastFailed && (
          <ReportFailed
            message={lastFailed.error ?? text.readFailed}
            retrying={retry.isPending}
            retryError={retry.error?.message}
            onRetry={() => retry.mutate(lastFailed.id, { onSuccess: () => dashboard.refetch() })}
          />
        )}
        {data?.latest && data.newSince.length > 0 && (
          <NewSinceStrip since={data.latest.date} reports={data.newSince} />
        )}
        {data?.latest && <LatestReportCard report={data.latest} />}
        {data?.latest && <EpisodeCardContainer profileId={profile?.id} />}
        {data?.latest && <YearReviewCardContainer profileId={profile?.id} />}
        {retests && retests.length > 0 && (
          <RetestList retests={retests} today={new Date()} onAddToCalendar={addToCalendar} />
        )}
        {isEmpty && (
          <EmptyState
            icon={FileText}
            title={text.empty.title}
            body={text.empty.body}
            action={<UploadButton />}
          />
        )}
        {family.data && (
          <FamilyList
            members={family.data}
            activeId={profile?.id}
            today={new Date()}
            onSelect={setActiveProfileId}
          />
        )}
        {data && data.recent.length > 0 && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {data.latest && (
              <AttentionList
                reportId={data.latest.id}
                markers={data.moveFirst}
                flaggedCount={data.latest.counts.watch + data.latest.counts.risk}
              />
            )}
            <RecentReports reports={data.recent} />
          </div>
        )}
      </div>
    </>
  );
}
