import { reportFilesSchema } from "@mediwise/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createReport } from "../api/create-report";
import { markReportUploaded } from "../api/mark-report-uploaded";
import { uploadFile } from "../api/upload-file";
import { toReportFile } from "./use-selected-files";

/**
 * Creates a report, uploads its files in parallel and confirms the upload.
 *
 * @remarks
 * Resolves with the report id. `progress` holds one 0 to 1 fraction per file, in input order.
 */
export function useUploadReport() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number[]>([]);
  const upload = useMutation({
    mutationFn: async ({ profileId, files }: { profileId: string; files: File[] }) => {
      const described = reportFilesSchema.parse(files.map(toReportFile));
      setProgress(files.map(() => 0));
      const { id, uploadUrls } = await createReport({ profileId, files: described });
      await Promise.all(
        files.map((file, i) => {
          const url = uploadUrls[i];
          const mime = described[i]?.mime;
          if (!url || !mime) throw new Error("The upload failed. Try again.");
          return uploadFile(url, file, mime, (fraction) =>
            setProgress((current) => current.with(i, fraction)),
          );
        }),
      );
      await markReportUploaded(id);
      return id;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["me"] }),
      ]),
  });
  return { upload, progress };
}
