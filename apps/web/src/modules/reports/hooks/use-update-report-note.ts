import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReportNote } from "../api/update-report-note";
import type { ReportDetail } from "../types";

/**
 * Saves the note of a report and writes it into the cached report.
 *
 * @remarks
 * Writing the cache instead of a refetch keeps the field in its saved state with no flash of unsaved text.
 */
export function useUpdateReportNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReportNote,
    onSuccess: ({ note }, { reportId }) =>
      queryClient.setQueryData<ReportDetail>(["reports", reportId], (report) =>
        report ? { ...report, note } : report,
      ),
  });
}
