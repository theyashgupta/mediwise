import { findMarker } from "./catalog/index.js";

const group = String.raw`(?:cord blood|new ?borns?|neonates?|infants?|child(?:ren)?|adults?|adolescents?|elderly|men|women|males?|females?|pregnancy|pregnant women|(?:first|second|third|1st|2nd|3rd) trimester)`;
const age = String.raw`(?:[<>]=?\s*)?\d+(?:\.\d+)?\s*(?:(?:-|to)\s*\d+(?:\.\d+)?\s*)?(?:days?|weeks?|wks?|months?|mths?|years?|yrs?)(?:\s+old)?`;
const populationRow = new RegExp(String.raw`^(?:${group}(?:\s*${age})?|${age})$`, "i");

/**
 * Tells whether a printed row name is an age or population group, such as "Cord blood" or "1 to 4 days".
 *
 * @remarks
 * Such rows come from reference tables printed under a result, for example TSH by age, and are not results.
 */
export function isPopulationRow(rawName: string): boolean {
  return populationRow.test(
    rawName
      .replace(/[():,]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

const squash = (text: string) => text.replace(/\s+/g, " ").trim().toLowerCase();
const nameColumn = (line: string) => line.trim().split(/ {2,}/)[0] ?? "";
const indent = (line: string) => line.length - line.trimStart().length;

/**
 * Joins a test name that the lab printed over two lines, such as "HIGH SENSITIVITY C-REACTIVE" and "PROTEIN (HS-CRP)".
 *
 * @remarks
 * The next line in the name column, at the same indent, is added only when the joined name maps to a catalog marker that the
 * first line alone does not, and the next line is not a test of its own. So a method line or the next test never joins,
 * and "Urea" above "Creatinine" never becomes the urea to creatinine ratio.
 */
export function joinWrappedNames<T extends { rawName: string; panel?: string }>(
  markers: T[],
  pageTexts: string[],
): T[] {
  const lines = pageTexts.flatMap((page) => page.split("\n").filter((line) => line.trim()));
  const tests = new Set(markers.map((marker) => squash(marker.rawName)));
  return markers.map((marker) => {
    const at = lines.findIndex((line) => squash(nameColumn(line)) === squash(marker.rawName));
    const [line, next] = [lines[at], lines[at + 1]];
    if (at < 0 || !line || !next || indent(next) !== indent(line)) return marker;
    if (tests.has(squash(nameColumn(next)))) return marker;
    const joined = `${marker.rawName} ${nameColumn(next)}`;
    const entry = findMarker(joined, marker.panel);
    return entry && entry.key !== findMarker(marker.rawName, marker.panel)?.key
      ? { ...marker, rawName: joined }
      : marker;
  });
}
