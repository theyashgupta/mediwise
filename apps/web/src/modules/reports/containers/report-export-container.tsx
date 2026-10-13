import { getRouteApi } from "@tanstack/react-router";
import { FileClock } from "lucide-react";
import { useEffect, useRef } from "react";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useProfiles } from "@/modules/profiles";
import { useEarlierValues } from "@/modules/trends";
import { ReportExport } from "../components/report-export";
import { dateOptions, profileDetails } from "../config/export";
import { useReportTranslation } from "../hooks/use-report-translation";
import { useReport } from "../hooks/use-reports";
import { ShareReportContainer } from "./share-report-container";

const route = getRouteApi("/reports/$reportId/export");

/**
 * Opens the print dialog once, after the report and its profile are on the page.
 *
 * @remarks
 * Waits for web fonts, so the print preview does not lay out the page with the fallback font. The ref stops a second dialog when React runs the effect twice in development.
 */
function usePrintWhenReady(ready: boolean) {
  const printed = useRef(false);
  useEffect(() => {
    if (!ready || printed.current) return;
    printed.current = true;
    void document.fonts.ready.then(() => window.print());
  }, [ready]);
}

function Content() {
  const t = useT();
  const { reportId } = route.useParams();
  const report = useReport(reportId);
  const profiles = useProfiles();
  const earlier = useEarlierValues(reportId, report.data?.status === "done");
  const { translating } = useReportTranslation(reportId, report.data?.translation);
  const ready =
    report.data?.status === "done" && profiles.isSuccess && earlier.isSuccess && !translating;
  usePrintWhenReady(ready);

  if (report.isPending || profiles.isPending) return <LoadingState variant="page" />;
  if (report.isError) {
    return <ErrorState message={t.reports.export.loadError} onRetry={() => report.refetch()} />;
  }
  if (profiles.isError) {
    return (
      <ErrorState message={t.reports.export.profileError} onRetry={() => profiles.refetch()} />
    );
  }
  if (earlier.isError) {
    return (
      <ErrorState message={t.reports.export.previousError} onRetry={() => earlier.refetch()} />
    );
  }
  if (report.data.status !== "done") {
    return (
      <EmptyState
        icon={FileClock}
        title={t.reports.export.notReadyTitle}
        body={t.reports.export.notReadyBody}
      />
    );
  }

  if (earlier.isPending) return <LoadingState variant="page" />;

  return (
    <ReportExport
      report={report.data}
      earlier={earlier.data}
      person={profileDetails(profiles.data.find((profile) => profile.id === report.data.profileId))}
      generatedOn={new Date().toLocaleDateString(getIntlTag(), dateOptions)}
      onPrint={() => window.print()}
      actions={<ShareReportContainer reportId={reportId} />}
    />
  );
}

export function ReportExportContainer() {
  return (
    <div data-theme="light" className="min-h-svh">
      <main className="mx-auto w-full max-w-[210mm] px-4 py-8 print:max-w-none print:p-0">
        <Content />
      </main>
    </div>
  );
}
