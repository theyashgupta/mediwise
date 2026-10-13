import { maxEpisodeNoteLength } from "@mediwise/shared";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EpisodeFieldsProps = {
  id: string;
  name: string;
  note: string;
  onNameChange: (name: string) => void;
  onNoteChange: (note: string) => void;
};

export function EpisodeFields({ id, name, note, onNameChange, onNoteChange }: EpisodeFieldsProps) {
  const t = useT().episodes.fields;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>{t.name}</Label>
        <Input
          id={`${id}-name`}
          data-testid={`${id}-name`}
          value={name}
          required
          maxLength={80}
          placeholder={t.namePlaceholder}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-note`}>{t.note}</Label>
        <Input
          id={`${id}-note`}
          value={note}
          maxLength={maxEpisodeNoteLength}
          aria-describedby={`${id}-note-help`}
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <p id={`${id}-note-help`} className="text-xs text-muted-foreground">
          {t.noteHelp}{" "}
          {t.characters(
            note.length.toLocaleString(getIntlTag()),
            maxEpisodeNoteLength.toLocaleString(getIntlTag()),
          )}
        </p>
      </div>
    </div>
  );
}
