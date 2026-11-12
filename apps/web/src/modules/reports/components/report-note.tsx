import { maxReportNoteLength } from "@mediwise/shared";
import { useState } from "react";
import { Textarea } from "@/common/components/controls/textarea";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import { changedNote, noteStatus } from "../config/note";

type ReportNoteProps = {
  note: string | null;
  saving: boolean;
  saved: boolean;
  failed: boolean;
  onSave: (note: string) => void;
};

export function ReportNote({ note, saving, saved, failed, onSave }: ReportNoteProps) {
  const t = useT();
  const [draft, setDraft] = useState(note ?? "");
  const changed = changedNote(draft, note) !== undefined;
  const status = noteStatus({ saving, failed, saved, changed });

  return (
    <section className="max-w-measure space-y-2">
      <label htmlFor="report-note" className="sr-only">
        {t.report.note.label}
      </label>
      <p id="report-note-help" className="text-sm text-muted-foreground">
        {t.report.note.help}
      </p>
      <Textarea
        id="report-note"
        value={draft}
        maxLength={maxReportNoteLength}
        rows={3}
        placeholder={t.report.note.placeholder}
        aria-describedby="report-note-help report-note-status"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = changedNote(draft, note);
          if (next !== undefined && !saving) onSave(next);
        }}
        className="min-h-20"
      />
      <div className="flex justify-between gap-4 text-sm">
        <p
          id="report-note-status"
          aria-live="polite"
          className={cn(failed && changed ? "text-destructive" : "text-muted-foreground")}
        >
          {status}
        </p>
        <p className="shrink-0 text-muted-foreground tabular-nums">
          {t.report.note.characters(
            draft.length.toLocaleString(getIntlTag()),
            maxReportNoteLength.toLocaleString(getIntlTag()),
          )}
        </p>
      </div>
    </section>
  );
}
