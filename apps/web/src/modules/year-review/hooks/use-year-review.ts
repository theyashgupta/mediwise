import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getYearReview } from "../api/get-year-review";
import { writeYearReviewIntro } from "../api/write-year-review-intro";

export function useYearReview(profileId: string | undefined) {
  return useQuery({
    queryKey: ["year-review", profileId],
    queryFn: () => getYearReview(profileId ?? ""),
    enabled: Boolean(profileId),
  });
}

export function useWriteYearReviewIntro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: writeYearReviewIntro,
    onSuccess: (review, profileId) => queryClient.setQueryData(["year-review", profileId], review),
  });
}
