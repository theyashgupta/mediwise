import { Link } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { ReportList } from "../components/report-list";
import { useReports } from "../hooks/use-reports";

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

export function ReportsContainer() {
  const { profile } = useActiveProfile();
  const reports = useReports(profile?.id);
  const items = reports.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader
        title="Reports"
        description={profile ? `Reports for ${profile.name}, newest first.` : undefined}
      />
      {(!profile || reports.isPending) && <LoadingState variant="list" />}
      {reports.isError && (
        <ErrorState message="We could not load your reports." onRetry={() => reports.refetch()} />
      )}
      {reports.isSuccess && items.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          body="Upload a PDF or photos of a report. We explain and score every marker."
          action={<UploadButton />}
        />
      )}
      {items.length > 0 && (
        <div className="space-y-6">
          <ReportList reports={items} />
          {reports.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => reports.fetchNextPage()}
              disabled={reports.isFetchingNextPage}
            >
              {reports.isFetchingNextPage ? "Loading" : "Show older reports"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
