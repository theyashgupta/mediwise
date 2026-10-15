import { beforeEach, expect, test, vi } from "vitest";
import { reportUsage } from "../extraction/index.js";
import { readReport } from "./process-report.service.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

beforeEach(() => edge.create.mockReset());

test("each row keeps the printed value and unit beside the canonical value, and HbA1c in two units is one row with the other unit in its note", async () => {
  edge.create.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "record_extraction",
        input: {
          collectedAt: "2025-03-14",
          age: 46,
          panels: [
            {
              name: "U&E",
              rows: [
                ["Creatinine", 88.4, "umol/L", "59 - 104", 1],
                ["HbA1c", 6.5, "%", null, 1],
                ["HbA1c", 48, "mmol/mol", null, 1],
              ],
            },
          ],
        },
      },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 10 },
  });
  edge.create.mockResolvedValue({
    content: [],
    stop_reason: "end_turn",
    usage: { input_tokens: 1, output_tokens: 1 },
  });

  const read = await readReport(
    "report-1",
    [{ text: "U&E" }],
    { dateOfBirth: "1979-04-09", sex: "female", ancestry: "unknown" },
    reportUsage(),
  );

  expect(read.markerRows).toMatchObject([
    {
      markerKey: "creatinine",
      value: 1,
      unit: "mg/dL",
      printedValue: 88.4,
      printedUnit: "umol/L",
      labRangeLow: 0.67,
      labRangeHigh: 1.18,
    },
    {
      markerKey: "hba1c",
      value: 6.5,
      unit: "%",
      printedValue: 6.5,
      printedUnit: "%",
      note: "48 mmol/mol",
    },
  ]);
  expect(read.markerRows[1]?.status).not.toBeNull();
  expect(read.output.markers.filter((m) => m.markerKey === "hba1c")).toHaveLength(1);
});

test("the AU fixture stores one HbA1c row with the mmol/mol print kept as the alternate", async () => {
  edge.create.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "record_extraction",
        input: {
          collectedAt: "2025-03-14",
          age: 52,
          panels: [
            {
              name: "Biochemistry",
              rows: [
                ["HbA1c", "6.6 H", "%", "< 6.0", 1],
                ["HbA1c", "49 H", "mmol/mol", "< 42", 1],
                ["Glucose (fasting)", "6.4 H", "mmol/L", "3.0 - 6.0", 1],
                ["Urea", 6.2, "mmol/L", "2.5 - 8.0", 1],
                ["Creatinine", 81, "umol/L", "60 - 110", 1],
                ["eGFR (CKD-EPI 2021)", ">90", "mL/min/1.73m2", "> 60", 1],
                ["Uric acid", 0.38, "mmol/L", "0.20 - 0.42", 1],
                ["Calcium", 2.38, "mmol/L", "2.10 - 2.60", 1],
                ["Cholesterol", 5.1, "mmol/L", "< 5.5", 1],
                ["HDL cholesterol", 1.1, "mmol/L", "> 1.0", 1],
                ["LDL cholesterol", 3.2, "mmol/L", "< 3.5", 1],
                ["Triglycerides", "1.9 H", "mmol/L", "< 1.5", 1],
                ["Haemoglobin", 152, "g/L", "130 - 180", 1],
                ["Ferritin", 210, "ug/L", "30 - 500", 1],
              ],
            },
          ],
        },
      },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 10 },
  });
  edge.create.mockResolvedValue({
    content: [],
    stop_reason: "end_turn",
    usage: { input_tokens: 1, output_tokens: 1 },
  });

  const read = await readReport(
    "report-au",
    [{ text: "Wattle Creek Pathology" }],
    { dateOfBirth: "1972-11-03", sex: "male", ancestry: "unknown" },
    reportUsage(),
  );
  const keys = read.markerRows.map((row) => row.markerKey).filter(Boolean);

  expect(read.markerRows).toHaveLength(13);
  expect(new Set(keys).size).toBe(keys.length);
  expect(read.markerRows.filter((row) => row.markerKey === "hba1c")).toEqual([
    expect.objectContaining({
      value: 6.6,
      unit: "%",
      printedValue: 6.6,
      printedUnit: "%",
      labRangeHigh: 6,
      note: "49 mmol/mol",
    }),
  ]);
});
