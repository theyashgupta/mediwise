import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { translateReport } from "../api/translate-report";

/**
 * Asks the API once for the translation of a report that has none in the active locale, then reloads the report.
 *
 * @remarks
 * The API stores the result, so a reload or a second tab never pays for a second translation. Returns true while
 * the translation runs, so the export can wait before it prints.
 */
export function useReportTranslation(
  reportId: string,
  translation: "done" | "failed" | "missing" | null | undefined,
) {
  const queryClient = useQueryClient();
  const asked = useRef<string | null>(null);
  const { mutate, isError } = useMutation({
    mutationFn: translateReport,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["reports", reportId] }),
  });
  const missing = translation === "missing";
  useEffect(() => {
    if (!missing || asked.current === reportId) return;
    asked.current = reportId;
    mutate(reportId);
  }, [missing, mutate, reportId]);
  return { translating: missing && !isError, failed: translation === "failed" || isError };
}
