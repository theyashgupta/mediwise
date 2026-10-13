import { Link } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { ReportFailed, useRetryReport } from "@/modules/reports";
import { AttentionList } from "../components/attention-list";
import { DashboardGreeting } from "../components/dashboard-greeting";
import { LatestReportCard } from "../components/latest-report-card";
import { ProcessingCard } from "../components/processing-card";
import { ProfilePrompt } from "../components/profile-prompt";
import { RecentReports } from "../components/recent-reports";
import { useDashboard } from "../hooks/use-dashboard";
import { useDismissedForSession } from "../hooks/use-dismissed-for-session";

function UploadButton() {
  return (
    <Button asChild>
      <Link to="/reports/upload">
        <Upload aria-hidden />
        Upload a report
      </Link>
    </Button>
  );
}

export function DashboardContainer() {
  const { profile } = useActiveProfile();
  const dashboard = useDashboard(profile?.id);
  const retry = useRetryReport();
  const data = dashboard.data;
  const isEmpty = data?.recent.length === 0;
  const lastFailed = data?.recent[0]?.status === "failed" ? data.recent[0] : undefined;
  const [birthPromptDismissed, dismissBirthPrompt] = useDismissedForSession(
    "approximateBirthPromptDismissed",
  );
  const incomplete = profile && (!profile.dateOfBirth || !profile.sex);

  return (
    <>
      <DashboardGreeting firstName={profile?.name.split(" ")[0]} now={new Date()} />
      <div className="space-y-10">
        {profile && incomplete && (
          <ProfilePrompt
            title={`Complete ${profile.name}’s profile`}
            body="Add a date of birth and a sex. MediWise uses them to score each marker against the correct range."
            action="Complete profile"
            to="/profiles"
          />
        )}
        {profile && !incomplete && profile.dateOfBirthApproximate && !birthPromptDismissed && (
          <ProfilePrompt
            title={`Check ${profile.name}’s date of birth`}
            body="We calculated it from the age on a report. Some ranges change with age, so enter the exact date."
            action="Enter the date"
            to={profile.isSelf ? "/settings" : "/profiles"}
            onAction={dismissBirthPrompt}
          />
        )}
        {(!profile || dashboard.isPending) && <LoadingState variant="page" />}
        {dashboard.isError && (
          <ErrorState
            message="We could not load your dashboard."
            onRetry={() => dashboard.refetch()}
          />
        )}
        {data && data.processingCount > 0 && <ProcessingCard count={data.processingCount} />}
        {lastFailed && (
          <ReportFailed
            message={lastFailed.error ?? "We could not read your latest report."}
            retrying={retry.isPending}
            retryError={retry.error?.message}
            onRetry={() => retry.mutate(lastFailed.id, { onSuccess: () => dashboard.refetch() })}
          />
        )}
        {data?.latest && <LatestReportCard report={data.latest} />}
        {isEmpty && (
          <EmptyState
            icon={FileText}
            title="Upload your first report"
            body="Upload a PDF or photos of a report. We read every marker and explain it in plain English. We score each marker against ranges for your age, sex and ancestry."
            action={<UploadButton />}
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
