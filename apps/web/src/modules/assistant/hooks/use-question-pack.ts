import { useMutation, useQueryClient } from "@tanstack/react-query";
import { takeQuestionPack } from "../api/take-question-pack";

/** Spends 1 credit on 20 questions, then refetches `me` for the new credits and questions left. */
export function useQuestionPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: takeQuestionPack,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}
