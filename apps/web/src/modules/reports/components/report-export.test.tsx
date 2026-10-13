import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { EarlierValue, ExportReport, MarkerRow } from "../types";
import { ReportExport } from "./report-export";

const report: ExportReport = {
  header: {
    title: "14 Feb 2025 · blood panel (2 markers), ultrasound",
    labName: "Made-up Labs",
    collectedAt: "2025-02-14",
    reportedAt: "2025-02-15",
  },
  labs: ["Made-up Labs", "Made-up Imaging"],
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

function render(exported: ExportReport, earlier?: EarlierValue[]) {
  return renderToStaticMarkup(
    <ReportExport
      report={exported}
      earlier={earlier}
      person={[]}
      generatedOn="1 Mar 2025"
      onPrint={() => {}}
    />,
  );
}

const marker = (markerKey: string, name: string, value: number): MarkerRow => ({
  markerKey,
  name,
  shortName: null,
  description: "",
  value,
  valueText: null,
  unit: "mg/dL",
  precision: 0,
  status: "optimal",
  deviation: null,
  labRange: null,
  calibratedRange: null,
  labName: "Made-up Labs",
});

const earlierValue = (markerKey: string, value: number, reportId: string, collectedAt: string) => ({
  markerKey,
  value,
  reportId,
  labName: "Made-up Labs",
  collectedAt,
  createdAt: `${collectedAt}T09:00:00Z`,
});

const withMarkers: ExportReport = {
  ...report,
  categories: [
    {
      key: "metabolic",
      label: "Metabolic",
      labNames: ["Made-up Labs"],
      markers: [marker("glucose_fasting", "Glucose", 96), marker("ldl_cholesterol", "LDL", 120)],
    },
  ],
};

const rowOf = (html: string, name: string) => {
  const start = html.indexOf(`>${name}</th>`);
  return html.slice(start, html.indexOf("</tr>", start));
};

test("the export header names the report by its title and lists every lab under it", () => {
  const html = render(report);
  expect(html).toContain("14 Feb 2025 · blood panel (2 markers), ultrasound");
  expect(html).toContain("Made-up Labs, Made-up Imaging");
});

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
        earlier: { reportId: "a", date: "2025-02-10", labName: null, text: line },
        later: {
          reportId: "b",
          date: "2025-03-24",
          labName: null,
          text: "No adnexal mass is seen.",
        },
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

test("earlier values from two reports print each date in its row, with the change mark", () => {
  const html = render(withMarkers, [
    earlierValue("glucose_fasting", 92, "glucose-only", "2025-01-20"),
    earlierValue("ldl_cholesterol", 140, "full-panel", "2024-11-02"),
  ]);
  expect(html).not.toContain("Previous values are from");
  expect(rowOf(html, "Glucose")).toContain("92");
  expect(rowOf(html, "Glucose")).toContain("20 Jan 2025");
  expect(rowOf(html, "Glucose")).toContain("Higher now");
  expect(rowOf(html, "LDL")).toContain("140");
  expect(rowOf(html, "LDL")).toContain("2 Nov 2024");
  expect(rowOf(html, "LDL")).toContain("Lower now");
});

test("earlier values from one report print one line and no date in the rows", () => {
  const html = render(withMarkers, [
    earlierValue("glucose_fasting", 92, "full-panel", "2024-11-02"),
    earlierValue("ldl_cholesterol", 140, "full-panel", "2024-11-02"),
  ]);
  expect(html).toContain("Previous values are from Made-up Labs, 2 Nov 2024.");
  expect(rowOf(html, "LDL")).not.toContain("2024");
});

test("an export without earlier values prints no previous column", () => {
  expect(render(withMarkers, [])).not.toContain("Previous");
});
