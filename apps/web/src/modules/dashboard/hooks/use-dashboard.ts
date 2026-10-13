import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/get-dashboard";

/**
 * Loads the dashboard for one profile.
 *
 * @remarks
 * Refetches every 5 seconds while a report is still being read, so the card turns into a score.
 */
export function useDashboard(profileId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", profileId],
    queryFn: () => getDashboard(profileId ?? ""),
    enabled: Boolean(profileId),
    refetchInterval: (query) => ((query.state.data?.processingCount ?? 0) > 0 ? 5_000 : false),
  });
}
