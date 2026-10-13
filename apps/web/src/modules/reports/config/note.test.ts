import { expect, test } from "vitest";
import { changedNote, noteStatus } from "./note";

test("a note is saved only when its trimmed text differs from the saved note", () => {
  expect(changedNote("  Tired for two weeks. ", "Tired for two weeks.")).toBeUndefined();
  expect(changedNote("", null)).toBeUndefined();
  expect(changedNote(" Started walking daily ", null)).toBe("Started walking daily");
  expect(changedNote("  ", "Tired for two weeks.")).toBe("");
});

test("the status shows saving, then saved until the next edit, and an error only for unsaved text", () => {
  const idle = { saving: false, failed: false, saved: false, changed: false };
  expect(noteStatus({ ...idle, saving: true })).toBe("Saving");
  expect(noteStatus({ ...idle, saved: true })).toBe("Saved");
  expect(noteStatus({ ...idle, saved: true, changed: true })).toBe("");
  expect(noteStatus({ ...idle, failed: true, changed: true })).toMatch(/could not save/);
  expect(noteStatus(idle)).toBe("");
});
