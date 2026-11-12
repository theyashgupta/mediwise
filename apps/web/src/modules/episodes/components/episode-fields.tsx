import { maxEpisodeNoteLength } from "@mediwise/shared";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { Field } from "@/common/components/controls/field";
import { Input } from "@/common/components/controls/input";

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
      <Field label={t.name}>
        <Input
          id={`${id}-name`}
          data-testid={`${id}-name`}
          value={name}
          required
          maxLength={80}
          placeholder={t.namePlaceholder}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </Field>
      <Field
        label={t.note}
        hint={
          <>
            {t.noteHelp}{" "}
            {t.characters(
              note.length.toLocaleString(getIntlTag()),
              maxEpisodeNoteLength.toLocaleString(getIntlTag()),
            )}
          </>
        }
      >
        <Input
          id={`${id}-note`}
          value={note}
          maxLength={maxEpisodeNoteLength}
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </Field>
    </div>
  );
}
