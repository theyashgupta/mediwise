import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { askQuestion } from "../api/ask-question";
import { clearQuestions } from "../api/clear-questions";
import { flagQuestion } from "../api/flag-question";
import { listQuestions } from "../api/list-questions";
import type { Question } from "../types";

const questionsKey = (profileId: string) => ["assistant", profileId] as const;

export function useQuestions(profileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: questionsKey(profileId ?? ""),
    queryFn: () => listQuestions(profileId ?? ""),
    enabled: enabled && profileId !== undefined,
  });
}

/**
 * Sends one question and puts the stored answer at the top of the cached chat.
 *
 * @remarks
 * The list is newest first, like the API. `me` refetches without being awaited, because an answer can spend a
 * question and a 402 means `me` is stale, and an awaited refetch would keep the question pending.
 */
export function useAskQuestion(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { question: string; reportId?: string }) => askQuestion(profileId, body),
    onSuccess: (item) =>
      queryClient.setQueryData<Question[]>(questionsKey(profileId), (list = []) => [item, ...list]),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useFlagQuestion(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: flagQuestion,
    onSuccess: (flagged) =>
      queryClient.setQueryData<Question[]>(questionsKey(profileId), (list = []) =>
        list.map((item) => (item.id === flagged.id ? flagged : item)),
      ),
  });
}

export function useClearQuestions(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearQuestions(profileId),
    onSuccess: () => queryClient.setQueryData<Question[]>(questionsKey(profileId), []),
  });
}
