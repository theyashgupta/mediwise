import { useState } from "react";
import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EpisodeFields } from "./episode-fields";

type EpisodeSettingsProps = {
  name: string;
  note: string | null;
  ended: boolean;
  busy: boolean;
  failed: boolean;
  deleting: boolean;
  onSave: (fields: { name: string; note: string }) => void;
  onToggleEnd: () => void;
  onDelete: () => void;
};

export function EpisodeSettings({
  name: savedName,
  note: savedNote,
  ended,
  busy,
  failed,
  deleting,
  onSave,
  onToggleEnd,
  onDelete,
}: EpisodeSettingsProps) {
  const t = useT().episodes.settings;
  const [name, setName] = useState(savedName);
  const [note, setNote] = useState(savedNote ?? "");
  const [confirming, setConfirming] = useState(false);
  const changed = name.trim() !== savedName || note.trim() !== (savedNote ?? "");

  return (
    <Section id="episode-settings" title={t.title} className="print:hidden">
      <form
        className="space-y-4 rounded-xl border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ name: name.trim(), note: note.trim() });
        }}
      >
        <EpisodeFields
          id="episode-settings"
          name={name}
          note={note}
          onNameChange={setName}
          onNoteChange={setNote}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || !changed || !name.trim()}>
            {t.save}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={onToggleEnd}>
            {ended ? t.reopen : t.end}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(true)}>
            {t.delete}
          </Button>
        </div>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            {t.failed}
          </p>
        )}
      </form>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteDialog.title}</DialogTitle>
            <DialogDescription>{t.deleteDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t.deleteDialog.cancel}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? t.deleteDialog.deleting : t.deleteDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
