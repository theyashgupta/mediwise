import { getRouteApi } from "@tanstack/react-router";
import { Link2Off } from "lucide-react";
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
  const { token } = route.useParams();
  const shared = useSharedReport(token);

  if (shared.isPending) return <LoadingState variant="page" />;
  if (shared.error instanceof ProblemError && shared.error.status === 404) {
    return (
      <EmptyState
        icon={Link2Off}
        title="This link has ended"
        body="Ask the person who sent you this link for a new link."
      />
    );
  }
  if (shared.isError) {
    return <ErrorState message="We could not load this report." onRetry={() => shared.refetch()} />;
  }

  const { report, previous, person, expiresAt } = shared.data;
  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-muted px-3 py-2 text-sm print:hidden">
        This link ends on {shareDate(expiresAt)}.
      </p>
      <ReportExport
        report={report}
        previous={
          previous
            ? { report: previous, values: new Map(Object.entries(previous.values)) }
            : undefined
        }
        person={sharedPersonDetails(person)}
        generatedOn={new Date().toLocaleDateString("en-IN", dateOptions)}
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
