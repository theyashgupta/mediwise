export const noteLabel = "Notes for this visit";
export const noteHelp = "MediWise does not read this note. Your doctor sees it on the export.";

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
  if (saving) return "Saving";
  if (failed && changed) return "We could not save the note. Click outside the field to try again.";
  if (saved && !changed) return "Saved";
  return "";
}
