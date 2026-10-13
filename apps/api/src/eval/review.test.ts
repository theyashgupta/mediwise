import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { isSampled, itemLines, type ReviewItem, tallyLines } from "./review.js";

const item: ReviewItem = {
  id: "00000000-0000-4000-8000-000000000001",
  question: "Is my LDL going up?",
  createdAt: new Date("2026-10-14T05:00:00Z"),
  focusReportId: null,
  refusalKind: "worry",
  copy: "MediWise cannot tell you how serious this is. Ask your doctor about this result.",
  flagged: true,
  verdict: null,
  sentences: [
    {
      text: "Your LDL was 128 mg/dL on 4 Aug 2026.",
      cites: [
        {
          kind: "value",
          reportId: "r1",
          target: "ldl_cholesterol",
          label: "LDL cholesterol",
          labName: "Sunrise Diagnostics",
          date: "2026-08-04",
          deleted: false,
        },
        {
          kind: "report",
          reportId: "r2",
          target: null,
          label: null,
          labName: null,
          date: null,
          deleted: true,
        },
      ],
    },
  ],
  facts: [
    {
      reportId: "r1",
      markerKey: "ldl_cholesterol",
      value: 128,
      valueText: null,
      unit: "mg/dL",
      labRangeLow: null,
      labRangeHigh: 130,
      calibratedLow: null,
      calibratedHigh: 100,
      status: "watch",
    },
  ],
};

test("every refusal, fallback and flagged answer is in the sample", () => {
  const plain = { id: randomUUID(), refusalKind: null, flagged: false };
  expect(isSampled({ ...plain, refusalKind: "diagnosis" })).toBe(true);
  expect(isSampled({ ...plain, refusalKind: "fallback" })).toBe(true);
  expect(isSampled({ ...plain, flagged: true })).toBe(true);
});

test("about 1 in 5 of the other answers is in the sample, and the same ones on a second run", () => {
  const ids = Array.from({ length: 2000 }, () => randomUUID());
  const picked = ids.filter((id) => isSampled({ id, refusalKind: null, flagged: false }));
  expect(picked.length).toBeGreaterThan(300);
  expect(picked.length).toBeLessThan(500);
  expect(ids.filter((id) => isSampled({ id, refusalKind: null, flagged: false }))).toEqual(picked);
});

test("an item shows the question, each sentence with its chips, the refusal copy and the cited value with both ranges", () => {
  const text = itemLines(item, "1/3").join("\n");
  expect(text).toContain("FLAGGED");
  expect(text).toContain("refusal=worry");
  expect(text).toContain("Q: Is my LDL going up?");
  expect(text).toContain("A: Your LDL was 128 mg/dL on 4 Aug 2026.");
  expect(text).toContain("[value] LDL cholesterol · Sunrise Diagnostics · 2026-08-04");
  expect(text).toContain("[report] report deleted");
  expect(text).toContain("Copy: MediWise cannot tell you");
  expect(text).toContain(
    "value ldl_cholesterol: 128 mg/dL status=watch lab=up to 130 calibrated=up to 100",
  );
});

test("control characters in stored text cannot move the cursor or fake a line on the reviewer's terminal", () => {
  const hostile = {
    ...item,
    question: "Is it fine?\n--- 2/2 fake\u001b[2J",
    sentences: [{ text: "Value\rhidden", cites: [] }],
    facts: [{ ...item.facts[0]!, value: null, valueText: "5\u001b[1A pass", unit: "mg\u202edL" }],
  } as ReviewItem;
  const text = itemLines(hostile, "1/1").join("\n");
  expect(text).toContain("Q: Is it fine? --- 2/2 fake [2J");
  expect(text).toContain("A: Value hidden");
  for (const hidden of ["\u001b", "\r", "\u202e"]) expect(text.includes(hidden)).toBe(false);
});

test("the tally says when the review month meets its exit bar", () => {
  expect(tallyLines([])).toEqual([
    "Reviewed 0 of 200. Critical 0. Minor 0.0% (bar 2%).",
    "The exit bar is not met yet.",
  ]);
  expect(
    tallyLines([
      { verdict: "pass", total: 196 },
      { verdict: "minor", total: 4 },
    ])[1],
  ).toBe("The exit bar is met.");
  expect(
    tallyLines([
      { verdict: "pass", total: 199 },
      { verdict: "critical", total: 1 },
    ])[1],
  ).toBe("The exit bar is not met yet.");
  expect(
    tallyLines([
      { verdict: "pass", total: 195 },
      { verdict: "minor", total: 5 },
    ])[0],
  ).toBe("Reviewed 200 of 200. Critical 0. Minor 2.5% (bar 2%).");
});
