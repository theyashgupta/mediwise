import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getReport } from "../api/get-report";
import { getReports } from "../api/get-reports";
import { inProgress } from "../config/status";

/**
 * Pages through one profile's reports, newest first.
 *
 * @remarks
 * Refetches every 10 seconds while a loaded report is still being read, so its row turns into a score.
 */
export function useReports(profileId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["reports", "list", profileId],
    queryFn: ({ pageParam }) => getReports(profileId ?? "", pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(profileId),
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) => page.items.some((r) => inProgress(r.status)))
        ? 10_000
        : false,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => getReport(id),
    refetchInterval: (query) =>
      query.state.data && inProgress(query.state.data.status) ? 3_000 : false,
  });
}
