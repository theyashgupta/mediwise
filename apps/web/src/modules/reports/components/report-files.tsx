import { ShieldCheck } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Section } from "@/common/components/section";
import type { ReportDetail } from "../types";
import { FileTypeIcon } from "./file-type-icon";

type ReportFilesProps = {
  files: ReportDetail["files"];
  className?: string;
};

export function ReportFiles({ files, className }: ReportFilesProps) {
  const t = useT();
  const { otherDocuments, duplicates, identityRemoved } = files;
  if (otherDocuments.length === 0 && duplicates.length === 0 && !identityRemoved) return null;
  return (
    <Section
      id="report-files"
      className={className}
      title={t.report.files.title}
      description={otherDocuments.length > 0 ? t.report.files.description : undefined}
    >
      {identityRemoved && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t.report.files.identityRemoved}
        </p>
      )}
      {duplicates.map((name) => (
        <p key={name} className="text-sm text-muted-foreground">
          {t.report.files.skipped(name)}
        </p>
      ))}
      {otherDocuments.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {otherDocuments.map((document) => (
            <li key={document.name} className="flex items-center gap-3 px-4 py-3">
              <FileTypeIcon name={document.name} />
              <span className="min-w-0 flex-1 truncate font-medium">{document.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {t.report.files.documentClasses[document.documentClass]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
