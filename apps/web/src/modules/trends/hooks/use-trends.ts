import { useQuery } from "@tanstack/react-query";
import { getTrend } from "../api/get-trend";
import { getTrends } from "../api/get-trends";

export function useTrends(profileId: string | undefined) {
  return useQuery({
    queryKey: ["trends", profileId],
    queryFn: () => getTrends(profileId ?? ""),
    enabled: Boolean(profileId),
  });
}

export function useTrend(profileId: string | undefined, markerKey: string) {
  return useQuery({
    queryKey: ["trends", profileId, markerKey],
    queryFn: () => getTrend(profileId ?? "", markerKey),
    enabled: Boolean(profileId),
  });
}
