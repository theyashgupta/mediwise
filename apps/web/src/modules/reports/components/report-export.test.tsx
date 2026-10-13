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
  settled: [],
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

test("the export shows a settled alert and the later report as one block, in date order", () => {
  const line = "A 4.2 x 3.1 cm complex mass in the right adnexa.";
  const html = render({
    ...report,
    settled: [
      {
        kind: "study_alert",
        title: `Your ultrasound report says: "${line}"`,
        state: "settled",
        earlier: { reportId: "a", date: "2025-02-10", text: line },
        later: { reportId: "b", date: "2025-03-24", text: "No adnexal mass is seen." },
      },
    ],
  });
  expect(html).toContain("Repeat studies");
  const block = html.slice(html.indexOf("export-sequences"), html.indexOf("export-markers"));
  expect(block).toContain("Your ultrasound report says:");
  expect(block.indexOf("10 Feb 2025")).toBeLessThan(block.indexOf("24 Mar 2025"));
  expect(block).toContain("No adnexal mass is seen.");
  expect(block).toContain("Settled by the report of 24 Mar 2025.");
  expect(html).not.toContain("export-findings");
});

test("an export without a repeat study prints no repeat studies heading", () => {
  expect(render(report)).not.toContain("Repeat studies");
});
