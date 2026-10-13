import { maxReportTitleLength, type StudyKind } from "@mediwise/shared";

export type TitleFacts = {
  markerCount: number;
  markerDate: string | null;
  studies: { kind: StudyKind; performedAt: string | null }[];
  uploadDate: string;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const studyOrder: [StudyKind, string][] = [
  ["ultrasound", "ultrasound"],
  ["ecg", "ECG"],
  ["xray", "X-ray"],
  ["ct", "CT scan"],
  ["mri", "MRI scan"],
  ["pathology", "pathology report"],
  ["examination", "examination form"],
  ["other", "other study"],
];

function parts(date: string) {
  const [year, month, day] = date.split("-");
  return { day: String(Number(day)), month: months[Number(month) - 1], year };
}

/** Writes "1 Feb 2025" for one day, and "1 to 11 Feb 2025" or "28 Jan to 3 Feb 2025" for a range. */
export function dateRange(first: string, last: string) {
  const a = parts(first);
  const b = parts(last);
  const end = `${b.day} ${b.month} ${b.year}`;
  if (first === last) return end;
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} to ${end}`;
  return a.month === b.month ? `${a.day} to ${end}` : `${a.day} ${a.month} to ${end}`;
}

/**
 * Writes the title of a report from the dates and the contents inside it, never from a lab.
 *
 * @remarks
 * The marker count drops first when the title is longer than 60 characters, then the last study types give way to
 * "and n more". A study with no printed date takes the date of the lab panel, then the upload date.
 */
export function ruleTitle(facts: TitleFacts) {
  const fallback = facts.markerDate ?? facts.uploadDate;
  const dates = [
    ...(facts.markerCount > 0 ? [fallback] : []),
    ...facts.studies.map((study) => study.performedAt ?? fallback),
  ].sort();
  const when = dateRange(dates[0] ?? fallback, dates.at(-1) ?? fallback);
  const counts = new Map<StudyKind, number>();
  for (const { kind } of facts.studies) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  const studyParts = studyOrder.flatMap(([kind, name]) => {
    const count = counts.get(kind) ?? 0;
    if (count === 0) return [];
    return [count > 1 ? `${name} x${count}` : name];
  });
  const markers = facts.markerCount === 1 ? "1 marker" : `${facts.markerCount} markers`;
  const withCount = facts.markerCount > 0 ? [`blood panel (${markers})`] : [];
  const withoutCount = facts.markerCount > 0 ? ["blood panel"] : [];
  const title = (contents: string[]) =>
    contents.length > 0 ? `${when} · ${contents.join(", ")}` : when;
  const full = title([...withCount, ...studyParts]);
  if (full.length <= maxReportTitleLength) return full;
  const items = [...withoutCount, ...studyParts];
  for (let kept = items.length; kept > 0; kept--) {
    const rest = items.length - kept;
    const candidate = title([...items.slice(0, kept), ...(rest > 0 ? [`and ${rest} more`] : [])]);
    if (candidate.length <= maxReportTitleLength) return candidate;
  }
  return when;
}
