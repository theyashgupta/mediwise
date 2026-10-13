import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { queryClient } from "@/config/query-client";
import { getOverview } from "../api/get-overview";
import { retryFailedReport } from "../api/retry-failed-report";

const overviewQuery = queryOptions({
  queryKey: ["admin"],
  queryFn: getOverview,
  refetchInterval: 60_000,
});

export function useOverview() {
  return useQuery(overviewQuery);
}

/**
 * Shows the not found page on /admin to every user but the admin.
 *
 * @remarks
 * Any other failure is left to the page, which shows its error state with a retry.
 */
export async function requireAdmin() {
  const overview = await queryClient.fetchQuery(overviewQuery).catch(() => undefined);
  if (overview === null) throw notFound();
}

export function useRetryFailedReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}
