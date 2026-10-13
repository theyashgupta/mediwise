import type { Study } from "../types";

export const studyKindLabels: Record<Study["kind"], string> = {
  xray: "X-ray",
  ultrasound: "Ultrasound",
  ct: "CT scan",
  mri: "MRI scan",
  ecg: "ECG",
  examination: "Examination form",
  pathology: "Pathology report",
  other: "Study",
};

/**
 * Names a study card by its kind and, when printed, its body region: "X-ray, Chest PA".
 *
 * @remarks
 * A printed region that already names the kind, such as "Resting ECG", stands alone so the title does not repeat it.
 */
export function studyTitle({ kind, bodyRegion }: Pick<Study, "kind" | "bodyRegion">) {
  const label = studyKindLabels[kind];
  if (!bodyRegion) return label;
  const squash = (text: string) => text.toLowerCase().replace(/[^a-z]/g, "");
  return squash(bodyRegion).includes(squash(label)) ? bodyRegion : `${label}, ${bodyRegion}`;
}

/** Splits printed text into its lines, so a card shows each finding or ECG statement on its own line. */
export function printedLines(text: string | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
