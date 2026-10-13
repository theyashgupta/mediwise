import { useQuery } from "@tanstack/react-query";
import { getComparison } from "../api/get-comparison";

export function useComparison(query: { a?: string; b?: string; profileId?: string }) {
  return useQuery({
    queryKey: ["trends", "compare", query],
    queryFn: () => getComparison(query),
    enabled: Boolean(query.b ?? query.profileId),
  });
}
