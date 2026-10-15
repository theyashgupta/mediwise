import { beforeEach, expect, test, vi } from "vitest";
import { reportUsage } from "../extraction/index.js";
import { readReport } from "./process-report.service.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

beforeEach(() => edge.create.mockReset());

test("each row keeps the printed value and unit beside the canonical value, and HbA1c in two units scores once in one unit", async () => {
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
    { markerKey: "hba1c", value: 6.5, unit: "%", printedValue: 6.5, printedUnit: "%" },
    {
      markerKey: "hba1c",
      value: 6.5,
      unit: "%",
      printedValue: 48,
      printedUnit: "mmol/mol",
      status: null,
    },
  ]);
  expect(read.markerRows[1]?.status).not.toBeNull();
  expect(read.output.markers.filter((m) => m.markerKey === "hba1c")).toHaveLength(1);
});
