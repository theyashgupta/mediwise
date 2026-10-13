import { expect, test } from "vitest";
import { askSuggestions } from "./ask-suggestions";

const moveFirst = [
  {
    reportId: "r1",
    markerKey: "ldl_cholesterol",
    name: "LDL cholesterol",
    description: null,
    value: 128,
    unit: "mg/dL",
    status: "watch" as const,
  },
];
const retest = { markerKey: "hba1c", name: "HbA1c", dueOn: "2027-08-03", measuredOn: "2026-08-04" };
const newestFinding = { reportId: "r1", title: "HbA1c is in the watch range" };

test("each kind of data gives its question, in the order move first, finding, retest", () => {
  expect(askSuggestions({ moveFirst, newestFinding }, [retest])).toEqual([
    "How has my LDL cholesterol changed?",
    'What does my report say about "HbA1c is in the watch range"?',
    "When should I retest HbA1c?",
  ]);
});

test("missing data gives no question for it and never an empty one", () => {
  expect(askSuggestions({ moveFirst: [], newestFinding: null }, [retest])).toEqual([
    "When should I retest HbA1c?",
  ]);
  expect(askSuggestions({ moveFirst: [], newestFinding: null }, [])).toEqual([]);
});
