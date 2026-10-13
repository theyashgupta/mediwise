import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProblemError } from "@/common/utils/problem-error";
import { createShare } from "../api/create-share";
import { endShare } from "../api/end-share";
import { getSharedReport } from "../api/get-shared-report";
import { getShares } from "../api/get-shares";

export function useShares(reportId: string) {
  return useQuery({
    queryKey: ["reports", reportId, "shares"],
    queryFn: () => getShares(reportId),
  });
}

export function useCreateShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShare,
    onSuccess: (_data, reportId) =>
      queryClient.invalidateQueries({ queryKey: ["reports", reportId, "shares"] }),
  });
}

export function useEndShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endShare,
    onSuccess: (_data, { reportId }) =>
      queryClient.invalidateQueries({ queryKey: ["reports", reportId, "shares"] }),
  });
}

/**
 * Loads the export behind a share link once.
 *
 * @remarks
 * The API counts every request as an open, so the page never refetches. A 404 means the link ended, so it is not retried.
 */
export function useSharedReport(token: string) {
  return useQuery({
    queryKey: ["reports", "shared", token],
    queryFn: () => getSharedReport(token),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (count, error) => !(error instanceof ProblemError && error.status === 404) && count < 3,
  });
}
