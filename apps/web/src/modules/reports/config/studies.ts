import { getT } from "@/common/hooks/use-locale";
import { messages } from "@/config/messages";
import type { Study } from "../types";

/**
 * Names a study card by its kind and, when printed, its body region: "X-ray, Chest PA".
 *
 * @remarks
 * A printed region that already names the kind, such as "Resting ECG", stands alone so the title does not repeat it.
 * The lab prints in English, so the check uses the English kind name in every locale.
 */
export function studyTitle({ kind, bodyRegion }: Pick<Study, "kind" | "bodyRegion">) {
  const label = getT().report.studies.kinds[kind];
  if (!bodyRegion) return label;
  const squash = (text: string) => text.toLowerCase().replace(/[^a-z]/g, "");
  return squash(bodyRegion).includes(squash(messages.en.report.studies.kinds[kind]))
    ? bodyRegion
    : `${label}, ${bodyRegion}`;
}

/** Splits printed text into its lines, so a card shows each finding or ECG statement on its own line. */
export function printedLines(text: string | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
