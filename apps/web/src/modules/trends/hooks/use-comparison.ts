import { useQuery } from "@tanstack/react-query";
import { getComparison } from "../api/get-comparison";
import { getEarlierValues } from "../api/get-earlier-values";

export function useComparison(query: { a?: string; b?: string; profileId?: string }) {
  return useQuery({
    queryKey: ["trends", "compare", query],
    queryFn: () => getComparison(query),
    enabled: Boolean(query.b ?? query.profileId),
  });
}

export function useEarlierValues(reportId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["trends", "earlier", reportId],
    queryFn: () => getEarlierValues(reportId),
    enabled,
  });
}
