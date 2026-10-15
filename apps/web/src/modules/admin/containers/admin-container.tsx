import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { NotFoundState } from "@/common/components/not-found-state";
import { PageHeader } from "@/common/components/page-header";
import { CreditFilters } from "../components/credit-filters";
import { CreditSection } from "../components/credit-section";
import { FailedReads } from "../components/failed-reads";
import { useCreditHistory, useFailedReports, useRetryFailedReport } from "../hooks/use-admin";
import type { CreditFilter } from "../types";

export function AdminContainer() {
  const [filter, setFilter] = useState<CreditFilter>({});
  const credits = useCreditHistory(filter);
  const failed = useFailedReports();
  const retry = useRetryFailedReport();

  if (credits.isPending) return <LoadingState variant="page" />;
  if (credits.isError) {
    return (
      <ErrorState message="The credit history did not load." onRetry={() => credits.refetch()} />
    );
  }
  if (!credits.data) return <NotFoundState />;

  const { reportCredits, questionPacks, eventLimit } = credits.data;
  const newest = `The ${eventLimit} newest events.`;
  const showUser = (userId: string) => setFilter({ ...filter, userId });

  return (
    <>
      <PageHeader
        title="Operator"
        description="Credit history of every user. Dates are UTC days. This page shows no patient data."
      />
      <div className="space-y-12">
        <CreditFilters filter={filter} onChange={setFilter} />
        <CreditSection
          id="admin-report-credits"
          title="Report credits"
          description={`One credit reads one report. ${newest}`}
          group={reportCredits}
          onUser={showUser}
        />
        <CreditSection
          id="admin-question-packs"
          title="Question packs"
          description={`One credit buys a pack of questions for Ask. ${newest}`}
          group={questionPacks}
          onUser={showUser}
        />
        {failed.isError ? (
          <ErrorState message="The failed reads did not load." onRetry={() => failed.refetch()} />
        ) : (
          failed.data && (
            <FailedReads
              failed={failed.data}
              retryingId={retry.isPending ? retry.variables : undefined}
              onRetry={(id) =>
                retry.mutate(id, {
                  onSuccess: () => toast.success("The report is in the queue again."),
                  onError: (error) => toast.error(error.message),
                })
              }
            />
          )
        )}
      </div>
    </>
  );
}
