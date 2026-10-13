import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReportTitle } from "../api/update-report-title";
import type { ReportDetail } from "../types";

/**
 * Saves the title of a report, writes it into the cached report and refreshes every list that shows it.
 *
 * @remarks
 * The Reports list, Home and the pickers read the title from their own queries, so they refetch.
 */
export function useUpdateReportTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReportTitle,
    onSuccess: ({ title, titleEdited }, { reportId }) => {
      queryClient.setQueryData<ReportDetail>(["reports", reportId], (report) =>
        report ? { ...report, header: { ...report.header, title, titleEdited } } : report,
      );
      for (const queryKey of [["reports", "list"], ["dashboard"], ["trends"], ["episodes"]]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
