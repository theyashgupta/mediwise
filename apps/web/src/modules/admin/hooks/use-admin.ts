import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { queryClient } from "@/config/query-client";
import { getCreditHistory } from "../api/get-credit-history";
import { getFailedReports } from "../api/get-failed-reports";
import { retryFailedReport } from "../api/retry-failed-report";
import type { CreditFilter } from "../types";

const failedReportsQuery = queryOptions({
  queryKey: ["admin", "failed-reports"],
  queryFn: getFailedReports,
  refetchInterval: 60_000,
});

export function useCreditHistory(filter: CreditFilter) {
  return useQuery({
    queryKey: ["admin", "credits", filter],
    queryFn: () => getCreditHistory(filter),
    placeholderData: keepPreviousData,
  });
}

export function useFailedReports() {
  return useQuery(failedReportsQuery);
}

/**
 * Shows the not found page on /admin to every user but the admin.
 *
 * @remarks
 * Any other failure is left to the page, which shows its error state with a retry.
 */
export async function requireAdmin() {
  const failed = await queryClient.fetchQuery(failedReportsQuery).catch(() => undefined);
  if (failed === null) throw notFound();
}

export function useRetryFailedReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}
