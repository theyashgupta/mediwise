import { toast } from "sonner";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { AdminOverview } from "../components/admin-overview";
import { useOverview, useRetryFailedReport } from "../hooks/use-admin";

export function AdminContainer() {
  const overview = useOverview();
  const retry = useRetryFailedReport();

  if (overview.isPending) return <LoadingState variant="page" />;
  if (overview.isError) {
    return <ErrorState message="The numbers did not load." onRetry={() => overview.refetch()} />;
  }
  if (!overview.data) return null;

  return (
    <>
      <PageHeader
        title="Operator"
        description="Counts and costs from the database. This page shows no patient data."
      />
      <AdminOverview
        overview={overview.data}
        retryingId={retry.isPending ? retry.variables : undefined}
        onRetry={(id) =>
          retry.mutate(id, {
            onSuccess: () => toast.success("The report is in the queue again."),
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </>
  );
}
