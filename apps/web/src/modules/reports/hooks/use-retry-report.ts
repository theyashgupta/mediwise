import { useMutation, useQueryClient } from "@tanstack/react-query";
import { retryReport } from "../api/retry-report";

export function useRetryReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}
