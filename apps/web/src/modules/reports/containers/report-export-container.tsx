import { getRouteApi } from "@tanstack/react-router";
import { FileClock } from "lucide-react";
import { useRef } from "react";
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
 * Returns a callback that opens the print dialog once, when the pages are cut with the report and its profile on them.
 *
 * @remarks
 * The pages are cut after the web fonts load, so the print preview never uses the fallback font. The ref stops a second dialog when the pages are cut again.
 */
function usePrintOnce(ready: boolean) {
  const printed = useRef(false);
  return () => {
    if (!ready || printed.current) return;
    printed.current = true;
    window.print();
  };
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
  const printOnce = usePrintOnce(ready);

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
  const profile = profiles.data.find((item) => item.id === report.data.profileId);

  return (
    <ReportExport
      report={report.data}
      earlier={earlier.data}
      person={profileDetails(profile)}
      generatedOn={new Date().toLocaleDateString(getIntlTag(), dateOptions)}
      firstName={profile?.name}
      onPrint={() => window.print()}
      onPaged={printOnce}
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
