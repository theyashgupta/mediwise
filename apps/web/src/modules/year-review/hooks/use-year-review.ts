import { useQuery } from "@tanstack/react-query";
import { getYearReview } from "../api/get-year-review";

export function useYearReview(profileId: string | undefined) {
  return useQuery({
    queryKey: ["year-review", profileId],
    queryFn: () => getYearReview(profileId ?? ""),
    enabled: Boolean(profileId),
  });
}
