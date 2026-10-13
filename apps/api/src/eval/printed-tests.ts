export type PrintedTest = { name: string; result: string; panel?: string; page: number };

const number = String.raw`(?:[<>]=?\s*)?\d[\d,]*(?:\.\d+)?`;
const result = new RegExp(
  String.raw`^${number}(?:\s|$)|^(?:nil|absent|present|negative|positive|normal|trace|clear|reactive|non[- ]?reactive|pale|yellow|acidic|alkaline)\b`,
  "i",
);
const nameWithValue = new RegExp(String.raw`^(.*[A-Za-z)\]])\s(${number})$`);
const notATest =
  /^(page|date|test name|sample|age|ref|patient|reg|report|collect|interpretation|note|comment|method|dr\.?)\b|^\d+ to /i;
const methodLine =
  /^(calculated|direct|flow cytometry|clia|eclia|ifcc|jaffes?|trinders|gpo|god|immuno|colorimetric|enzymatic|microscopy|dipstick|spectrophotometry|sheath flow|sls|ph indicator|photoelectric|nitroprusside|peroxidase|diazo|griess|hplc|uricase|urease|sulpho|rotheras|chromazol)/i;
const subHeading = /examination|macroscopy|microscopy|differential|absolute/i;
const footer = /scan to validate|end of report|correlate|authenticity/i;

/**
 * Finds the printed test rows in pdftotext layout pages: a name, a gap, then a number or a word result.
 *
 * @remarks
 * Offline evaluation only, so it is a heuristic. A heading is a text-only line indented two spaces or less, and it sets the
 * panel. One following line that ends in ")" or starts in lower case is the rest of a wrapped name.
 */
export function printedTests(pages: string[]): PrintedTest[] {
  const tests: PrintedTest[] = [];
  let panel: string | undefined;
  pages.forEach((page, pageIndex) => {
    panel = undefined;
    let last: PrintedTest | undefined;
    for (const line of page.split("\n")) {
      const body = line.trim();
      if (!body) continue;
      const indent = line.length - line.trimStart().length;
      const columns = body.split(/ {2,}/);
      const joined = nameWithValue.exec(columns[0] ?? "");
      const [name, value] = joined ? [joined[1] ?? "", joined[2] ?? ""] : columns;
      const isRow = name && value && result.test(value) && !/ to |=/.test(value);
      if (!isRow) {
        const first = columns[0] ?? "";
        if (last && !methodLine.test(first) && (/\)$/.test(first) || /^[a-z(]/.test(first))) {
          last.name = `${last.name} ${first}`;
        } else if (
          columns.length === 1 &&
          indent <= 2 &&
          body.length <= 60 &&
          !footer.test(body) &&
          !/\d|:/.test(body) &&
          !methodLine.test(body) &&
          !subHeading.test(body)
        ) {
          panel = body;
        }
        last = undefined;
        continue;
      }
      last = undefined;
      if (!/^[A-Za-z0-9]/.test(name) || name.includes(":") || name.length > 60) continue;
      if (notATest.test(name) || methodLine.test(name)) continue;
      last = { name, result: value, panel, page: pageIndex };
      tests.push(last);
    }
  });
  return tests;
}
