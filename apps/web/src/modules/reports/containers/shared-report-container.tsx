import { getRouteApi } from "@tanstack/react-router";
import { Link2Off } from "lucide-react";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { ProblemError } from "@/common/utils/problem-error";
import { ReportExport } from "../components/report-export";
import { dateOptions, sharedPersonDetails } from "../config/export";
import { shareDate } from "../config/share";
import { useSharedReport } from "../hooks/use-shares";

const route = getRouteApi("/share/$token");

function Content() {
  const t = useT();
  const { token } = route.useParams();
  const shared = useSharedReport(token);

  if (shared.isPending) return <LoadingState variant="page" />;
  if (shared.error instanceof ProblemError && shared.error.status === 404) {
    return (
      <EmptyState
        icon={Link2Off}
        title={t.reports.share.endedTitle}
        body={t.reports.share.endedBody}
      />
    );
  }
  if (shared.isError) {
    return <ErrorState message={t.reports.export.loadError} onRetry={() => shared.refetch()} />;
  }

  const { report, earlier, person, expiresAt } = shared.data;
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-muted px-3 py-2 text-sm print:hidden">
        {t.reports.share.endsOn(shareDate(expiresAt))}
      </p>
      <ReportExport
        report={report}
        earlier={earlier}
        person={sharedPersonDetails(person)}
        generatedOn={new Date().toLocaleDateString(getIntlTag(), dateOptions)}
        firstName={person.firstName}
        onPrint={() => window.print()}
      />
    </div>
  );
}

export function SharedReportContainer() {
  return (
    <div data-theme="light" className="min-h-svh bg-background text-foreground">
      <meta name="robots" content="noindex, nofollow" />
      <main className="mx-auto w-full max-w-[210mm] px-4 py-8 print:max-w-none print:p-0">
        <Content />
      </main>
    </div>
  );
}
