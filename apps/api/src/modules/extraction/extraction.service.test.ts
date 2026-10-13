import { readFile } from "node:fs/promises";
import { beforeEach, expect, test, vi } from "vitest";
import { extractReport, printedAge, printedRange, readPages } from "./extraction.service.js";
import { stepUsage } from "./extraction.usage.js";

const edge = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: edge.create } } }));

beforeEach(() => edge.create.mockReset());

test.each([
  ["13 - 17", { referenceLow: 13, referenceHigh: 17 }],
  ["4,000 - 11,000", { referenceLow: 4000, referenceHigh: 11000 }],
  ["Normal:- 0.3-4.5", { referenceLow: 0.3, referenceHigh: 4.5 }],
  ["> 90", { referenceLow: 90 }],
  ["< 200", { referenceHigh: 200 }],
  ["</= 5.6", { referenceHigh: 5.6 }],
  ["Up to 40", { referenceHigh: 40 }],
  ["Desirable : < 200, Borderline high: 200 - 239, Undesirable : > 240", {}],
  ["Absent", {}],
  [null, {}],
])("the printed range %j gives %j", (range, bounds) => {
  expect(printedRange(range)).toEqual(bounds);
});

test.each([
  ["24 Y 8 M 21 D /M", { ageYears: 24, ageMonths: 8, ageDays: 21 }],
  ["25 Yrs 5 Month 11 Days", { ageYears: 25, ageMonths: 5, ageDays: 11 }],
  ["47 Y /F", { ageYears: 47 }],
  ["38/M", { ageYears: 38 }],
  [52, { ageYears: 52 }],
  ["8 Months", { ageYears: 0, ageMonths: 8 }],
  ["Not given", undefined],
  [undefined, undefined],
])("the printed age %j gives %j", (age, parts) => {
  expect(printedAge(age)).toEqual(parts);
});

test("a PDF page with text goes to Claude as text, a page without text as an image, and tuples come back as markers with plain numbers parsed", async () => {
  edge.create.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "record_extraction",
        input: {
          labName: "Sunrise Diagnostics",
          collectedAt: "2024-03-10",
          panels: [
            { name: "Complete Blood Count", rows: [["Haemoglobin", 13.5, "g/dL", "13 - 17", 1]] },
            {
              name: null,
              rows: [
                ["Peripheral Smear RBC", "Normocytic", null, null, 2],
                ["ESR", "03", "mm/hr", "0 - 20", 2],
              ],
            },
          ],
        },
      },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 900, output_tokens: 60 },
  });
  const data = await readFile(new URL("../../../fixtures/two-pages.pdf", import.meta.url));

  const report = await extractReport(
    await readPages({ mime: "application/pdf", data }),
    stepUsage("claude-haiku-5-5"),
  );

  const request = edge.create.mock.calls[0]?.[0] as {
    messages: { content: { type: string; text?: string }[] }[];
  };
  const content = request.messages[0]?.content ?? [];
  expect(content.map((block) => block.type)).toEqual([
    "text",
    "image",
    "text",
    "text",
    "image",
    "text",
  ]);
  expect(content[0]?.text).toBe("The top of page 1 as an image, for the letterhead:");
  expect(content[2]?.text).toMatch(
    /^<page 1>\nComplete Blood Count\nHaemoglobin +13\.5 +g\/dL +13 - 17/,
  );
  expect(content[3]?.text).toBe("Page 2 is an image:");
  expect(report).toMatchObject({
    lab: { name: "Sunrise Diagnostics" },
    markers: [
      {
        rawName: "Haemoglobin",
        panel: "Complete Blood Count",
        value: 13.5,
        unit: "g/dL",
        referenceText: "13 - 17",
        referenceLow: 13,
        referenceHigh: 17,
        pageIndex: 0,
      },
      { rawName: "Peripheral Smear RBC", value: "Normocytic", pageIndex: 1 },
      { rawName: "ESR", value: 3, referenceLow: 0, referenceHigh: 20 },
    ],
  });
  expect(report.markers[1]?.panel).toBeUndefined();
});

test("a row with the wrong number of items is sent back for a retry", async () => {
  const call = (rows: unknown[]) => ({
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "record_extraction",
        input: { panels: [{ name: "CBC", rows }] },
      },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 10 },
  });
  edge.create
    .mockResolvedValueOnce(call([["Haemoglobin", 13.5, "g/dL", null, null, 1]]))
    .mockResolvedValueOnce(call([["Haemoglobin", 13.5, "g/dL", null, 1]]));

  const report = await extractReport(
    [{ mime: "image/jpeg", image: Buffer.from("jpeg") }],
    stepUsage("claude-haiku-5-5"),
  );

  const retry = edge.create.mock.calls[1]?.[0] as { messages: { content: { text?: string }[] }[] };
  expect(retry.messages[0]?.content.at(-1)?.text).toContain("failed validation");
  expect(report.markers[0]?.panel).toBe("CBC");
});

const labA = [
  "Patient ID           : 290325008                                                           Registration Time     : 01-Feb-2025 09:00 AM",
  "Patient Name         : Mr. Arjun Mehta                                                      Collection Time       : 01-Feb-2025 09:00 AM",
  "Ref. By Doctor       : CARE PLUS                                                         Sample No             *290325008*",
  "                                                Care Plus (Acme Insure - Package 5)",
  "  Test Name                                            Result                    Unit                   Bio.Ref.Range",
].join("\n");
test("a doctor read as the lab name is not stored", async () => {
  edge.create.mockResolvedValueOnce({
    content: [
      {
        type: "tool_use",
        id: "toolu_1",
        name: "record_extraction",
        input: {
          labName: "Dr.Kiran Joshi",
          referredBy: "CARE PLUS",
          panels: [{ name: "CBC", rows: [["Hemoglobin", 15.2, "gm/dl", "13.0-17.0", 1]] }],
        },
      },
    ],
    stop_reason: "tool_use",
    usage: { input_tokens: 10, output_tokens: 10 },
  });

  const report = await extractReport([{ text: labA }], stepUsage("claude-haiku-5-5"));

  expect(report.lab).toBeUndefined();
});
