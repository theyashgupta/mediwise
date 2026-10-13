import { useMutation, useQueryClient } from "@tanstack/react-query";
import { linkReports, updateLink } from "../api/link-reports";

/**
 * Links two reports, or confirms or dismisses a link, then loads every report and trend again.
 *
 * @remarks
 * A link changes the findings of both reports and the marks on the trend chart, so one cached report is not enough.
 */
export function useReportLinks() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
      queryClient.invalidateQueries({ queryKey: ["trends"] }),
    ]);
  return {
    link: useMutation({ mutationFn: linkReports, onSuccess }),
    update: useMutation({ mutationFn: updateLink, onSuccess }),
  };
}
