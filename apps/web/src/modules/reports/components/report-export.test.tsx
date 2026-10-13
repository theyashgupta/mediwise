import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { ExportReport } from "../types";
import { ReportExport } from "./report-export";

const report: ExportReport = {
  header: { labName: "Made-up Labs", collectedAt: "2025-02-14", reportedAt: "2025-02-15" },
  note: "Tired for two weeks.\nStarted walking daily.",
  moveFirst: [],
  patterns: [],
  findings: [],
  doctorQuestions: [],
  categories: [],
  derived: [],
  unmapped: [],
  studies: [],
  files: { images: [] },
};

function render(exported: ExportReport) {
  return renderToStaticMarkup(
    <ReportExport report={exported} person={[]} generatedOn="1 Mar 2025" onPrint={() => {}} />,
  );
}

test("the export prints the visit note under the visit dates, before the results", () => {
  const html = render(report);
  expect(html).toContain("Notes for this visit, written by the patient");
  expect(html).toContain("Tired for two weeks.\nStarted walking daily.");
  expect(html.indexOf("Collected on")).toBeLessThan(html.indexOf("Tired for two weeks"));
  expect(html.indexOf("Tired for two weeks")).toBeLessThan(html.indexOf("export-markers"));
});

test("an export without a note prints no note heading", () => {
  expect(render({ ...report, note: null })).not.toContain("Notes for this visit");
});
