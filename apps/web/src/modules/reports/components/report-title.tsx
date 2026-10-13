import { maxReportTitleLength } from "@mediwise/shared";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReportTitleProps = {
  title: string;
  edited: boolean;
  saving: boolean;
  failed: boolean;
  onSave: (title: string) => void;
  defaultEditing?: boolean;
};

export function ReportTitle({
  title,
  edited,
  saving,
  failed,
  onSave,
  defaultEditing = false,
}: ReportTitleProps) {
  const t = useT();
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState(title);
  const error = failed && (
    <p role="alert" className="text-sm text-destructive">
      {t.report.rename.saveError}
    </p>
  );

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-display text-balance">{title}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(title);
              setEditing(true);
            }}
          >
            <Pencil aria-hidden />
            {t.report.rename.open}
          </Button>
        </div>
        {error}
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-md space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim();
        if (next && next !== title) onSave(next);
        setEditing(false);
      }}
    >
      <h1 className="sr-only">{title}</h1>
      <label htmlFor="report-title" className="text-sm font-medium">
        {t.report.rename.label}
      </label>
      <Input
        id="report-title"
        value={draft}
        maxLength={maxReportTitleLength}
        autoFocus
        aria-describedby="report-title-help"
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex justify-between gap-4 text-sm text-muted-foreground">
        <p id="report-title-help">{t.report.rename.help}</p>
        <p className="shrink-0 tabular-nums">
          {t.report.rename.characters(
            draft.length.toLocaleString(getIntlTag()),
            maxReportTitleLength.toLocaleString(getIntlTag()),
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving || !draft.trim()}>
          {t.report.rename.save}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          {t.report.rename.cancel}
        </Button>
        {edited && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              onSave("");
              setEditing(false);
            }}
          >
            {t.report.rename.restore}
          </Button>
        )}
      </div>
    </form>
  );
}
