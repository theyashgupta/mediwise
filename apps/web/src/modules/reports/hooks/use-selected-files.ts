import { reportFilesSchema } from "@mediwise/shared";
import { useState } from "react";

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

/** Returns one message per problem with the selected files, or none when they can be uploaded. */
export function fileErrors(files: File[]) {
  if (files.length === 0) return [];
  const issues = reportFilesSchema.safeParse(files.map(toReportFile)).error?.issues ?? [];
  return [...new Set(issues.map((issue) => issue.message))];
}

export function useSelectedFiles() {
  const [files, setFiles] = useState<File[]>([]);
  return {
    files,
    errors: fileErrors(files),
    add: (added: File[]) => setFiles((current) => [...current, ...added]),
    remove: (index: number) => setFiles((current) => current.filter((_, i) => i !== index)),
  };
}
