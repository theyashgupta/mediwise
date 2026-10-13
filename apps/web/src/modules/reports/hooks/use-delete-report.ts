import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReport } from "../api/delete-report";

/**
 * Deletes a report and refreshes every report query except the deleted one.
 *
 * @remarks
 * Refetching the deleted report would flash a 404 before the page navigates away.
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReport,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ["reports", id], exact: true });
      return queryClient.invalidateQueries({
        queryKey: ["reports"],
        predicate: (query) => query.queryKey[1] !== id,
      });
    },
  });
}
