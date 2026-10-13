import { expect, test } from "vitest";
import { groupVisits } from "./visits";

test("done reports with one collection date form one visit, in the order of the list", () => {
  const visits = groupVisits([
    { id: "lab-b", status: "done", collectedAt: "2025-02-01" },
    { id: "older", status: "done", collectedAt: "2024-01-13" },
    { id: "lab-a", status: "done", collectedAt: "2025-02-01" },
  ]);
  expect(visits.map((visit) => visit.reports.map((report) => report.id))).toEqual([
    ["lab-b", "lab-a"],
    ["older"],
  ]);
});

test("a report not read yet stands alone, also when it has a date", () => {
  const visits = groupVisits([
    { id: "queued", status: "queued", collectedAt: null },
    { id: "failed", status: "failed", collectedAt: "2025-02-01" },
    { id: "done", status: "done", collectedAt: "2025-02-01" },
  ]);
  expect(visits).toHaveLength(3);
});
