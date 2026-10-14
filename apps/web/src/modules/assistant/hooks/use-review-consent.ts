import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { giveReviewConsent } from "../api/give-review-consent";

/**
 * Stores the review consent and refetches `me`, sending one request for a burst of ticks.
 *
 * @remarks
 * A double click fires twice before React shows the pending state, so a ref, not `isPending`, blocks the second post.
 */
export function useReviewConsent() {
  const queryClient = useQueryClient();
  const sending = useRef(false);
  const mutation = useMutation({
    mutationFn: giveReviewConsent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
    onSettled: () => {
      sending.current = false;
    },
  });
  const agree = () => {
    if (sending.current) return;
    sending.current = true;
    mutation.mutate();
  };
  return { ...mutation, agree };
}
