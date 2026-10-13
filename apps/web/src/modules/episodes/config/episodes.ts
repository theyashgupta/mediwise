import { getT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";

export function formatEpisodeDate(date: string) {
  return formatPlainDate(date, { day: "numeric", month: "short", year: "numeric" });
}

export function episodeDays(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/** Names a study by its kind and the body region the report prints, for example "Ultrasound, Pelvis". */
export function studyLabel(kind: string, bodyRegion: string | null) {
  const kinds: Record<string, string> = getT().report.studies.kinds;
  const name = kinds[kind] ?? getT().report.studies.kinds.other;
  return bodyRegion ? `${name}, ${bodyRegion}` : name;
}
