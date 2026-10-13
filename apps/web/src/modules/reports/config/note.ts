import { getT } from "@/common/hooks/use-locale";

/** Returns the note to save when the field loses focus, or undefined when it did not change. */
export function changedNote(draft: string, saved: string | null) {
  const note = draft.trim();
  return note === (saved ?? "") ? undefined : note;
}

/** Gives the line under the note field: saving, saved, or the error to act on. */
export function noteStatus({
  saving,
  failed,
  saved,
  changed,
}: {
  saving: boolean;
  failed: boolean;
  saved: boolean;
  changed: boolean;
}) {
  const { note } = getT().report;
  if (saving) return note.saving;
  if (failed && changed) return note.saveError;
  if (saved && !changed) return note.saved;
  return "";
}
