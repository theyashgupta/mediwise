import { maxReportNoteLength } from "@mediwise/shared";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { changedNote, noteHelp, noteLabel, noteStatus } from "../config/note";

type ReportNoteProps = {
  note: string | null;
  saving: boolean;
  saved: boolean;
  failed: boolean;
  onSave: (note: string) => void;
};

export function ReportNote({ note, saving, saved, failed, onSave }: ReportNoteProps) {
  const [draft, setDraft] = useState(note ?? "");
  const changed = changedNote(draft, note) !== undefined;
  const status = noteStatus({ saving, failed, saved, changed });

  return (
    <section className="max-w-measure space-y-2">
      <label htmlFor="report-note" className="text-xl font-semibold tracking-tight">
        {noteLabel}
      </label>
      <p id="report-note-help" className="text-sm text-muted-foreground">
        {noteHelp}
      </p>
      <textarea
        id="report-note"
        value={draft}
        maxLength={maxReportNoteLength}
        rows={3}
        placeholder="Example: I felt tired for two weeks before this test."
        aria-describedby="report-note-help report-note-status"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = changedNote(draft, note);
          if (next !== undefined && !saving) onSave(next);
        }}
        className="field-sizing-content min-h-20 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
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
          {draft.length.toLocaleString("en-IN")} of {maxReportNoteLength.toLocaleString("en-IN")}{" "}
          characters
        </p>
      </div>
    </section>
  );
}
