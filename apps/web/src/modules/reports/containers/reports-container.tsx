import { Link } from "@tanstack/react-router";
import { FileText, Upload } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { Button } from "@/components/ui/button";
import { useActiveProfile } from "@/modules/profiles";
import { ReportList } from "../components/report-list";
import { useReports } from "../hooks/use-reports";

function UploadButton() {
  const t = useT();
  return (
    <Button asChild>
      <Link to="/reports/upload">
        <Upload aria-hidden />
        {t.reports.list.upload}
      </Link>
    </Button>
  );
}

export function ReportsContainer() {
  const t = useT();
  const { profile } = useActiveProfile();
  const reports = useReports(profile?.id);
  const items = reports.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader
        title={t.reports.list.title}
        description={profile ? t.reports.list.description(profile.name) : undefined}
      />
      {(!profile || reports.isPending) && <LoadingState variant="list" />}
      {reports.isError && (
        <ErrorState message={t.reports.list.loadError} onRetry={() => reports.refetch()} />
      )}
      {reports.isSuccess && items.length === 0 && (
        <EmptyState
          icon={FileText}
          title={t.reports.list.emptyTitle}
          body={t.reports.list.emptyBody}
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
              {reports.isFetchingNextPage ? t.common.loading : t.reports.list.showOlder}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
