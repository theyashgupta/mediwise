const referrerLine =
  /(?:^[ \t]*|[ \t]{2,})Ref(?:erred)?\.?[ \t]*(?:By[ \t]*)?(?:Doctor|Dr\.?)?[ \t]*:[ \t]*(.*?)(?:[ \t]{2,}|$)/im;
const labelLine = /\S\s*:\s*\S/;

/**
 * Reads the referring doctor and the letterhead text out of the pdftotext layout of page 1.
 *
 * @remarks
 * The letterhead is the first line above the patient block that is not a title such as "Laboratory Investigation Report".
 * Many labs print it as a logo with no text layer, so it is often missing.
 */
export function printedHeader(page: string) {
  const referredBy = referrerLine.exec(page)?.[1]?.trim() || undefined;
  const lines = page.split("\n");
  const top = lines.slice(
    0,
    Math.max(
      lines.findIndex((line) => labelLine.test(line)),
      0,
    ),
  );
  const letterhead = top
    .map((line) => line.trim().split(/\s{2,}/)[0] ?? "")
    .find((line) => line && !/report/i.test(line));
  return { referredBy, letterhead };
}

const personTitle = /^(?:dr|mrs?|ms)\b/i;
const sameName = (a: string, b: string | undefined) =>
  b !== undefined && a.replace(/\s+/g, " ").toLowerCase() === b.replace(/\s+/g, " ").toLowerCase();

/**
 * Returns the lab name, or the page 1 letterhead text when the name is a person, the referrer or the package.
 *
 * @remarks
 * claude-haiku-5-5 put the referring doctor or the package name in the lab name when the letterhead was only a logo.
 */
export function checkedLabName(
  report: { labName?: string; referredBy?: string; packageName?: string },
  firstPage: string | undefined,
) {
  const header = printedHeader(firstPage ?? "");
  const notLab = [report.referredBy, report.packageName, header.referredBy];
  return [report.labName, header.letterhead].find(
    (name) => name && !personTitle.test(name) && !notLab.some((other) => sameName(name, other)),
  );
}
