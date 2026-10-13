import { maxFileBytes, maxFiles, maxTotalBytes, reportFilesSchema } from "@mediwise/shared";
import { useCallback, useState } from "react";
import { getT } from "@/common/hooks/use-locale";

/**
 * Describes a browser file the way `POST /reports` expects it.
 *
 * @remarks
 * Chrome on Windows and Android reports an empty type for HEIC photos, so the extension decides.
 */
export function toReportFile(file: File) {
  const mime = file.type || (/\.heic$/i.test(file.name) ? "image/heic" : "");
  return { name: file.name, mime, size: file.size };
}

const mb = 1024 * 1024;

/**
 * Returns one message per problem with the selected files, or none when they can be uploaded.
 *
 * @remarks
 * The shared schema decides what is wrong, and the message comes from the active locale. A bad file aborts the
 * schema before its count and size checks, so a file issue gets only its own message, as the schema does.
 */
export function fileErrors(files: File[]) {
  if (files.length === 0) return [];
  const issues = reportFilesSchema.safeParse(files.map(toReportFile)).error?.issues ?? [];
  if (issues.length === 0) return [];
  const { errors } = getT().reports.upload;
  const fileIssues = issues.filter((issue) => issue.path.length > 0);
  const messages =
    fileIssues.length > 0
      ? fileIssues.map((issue) => (issue.path[1] === "mime" ? errors.wrongType : errors.longName))
      : [
          ...(files.length > maxFiles ? [errors.tooMany(maxFiles)] : []),
          ...files
            .filter((file) => file.size > maxFileBytes)
            .map((file) => errors.tooLarge(file.name, maxFileBytes / mb)),
          ...(files.reduce((total, file) => total + file.size, 0) > maxTotalBytes
            ? [errors.tooLargeTogether(maxTotalBytes / mb)]
            : []),
        ];
  return [...new Set(messages)];
}

export function useSelectedFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const add = useCallback((added: File[]) => setFiles((current) => [...current, ...added]), []);
  return {
    files,
    errors: fileErrors(files),
    add,
    remove: (index: number) => setFiles((current) => current.filter((_, i) => i !== index)),
  };
}
