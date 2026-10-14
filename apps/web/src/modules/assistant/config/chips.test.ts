import { expect, test } from "vitest";
import type { Cite } from "../types";
import { chipTarget, chipText } from "./chips";

const reportId = "00000000-0000-4000-8000-0000000000c1";
const cite = (overrides: Partial<Cite>): Cite => ({
  kind: "value",
  reportId,
  target: "hba1c",
  label: "HbA1c",
  labName: "Sunrise Diagnostics",
  date: "2026-08-04",
  deleted: false,
  ...overrides,
});

test("a value chip opens the fact card of its report and marker", () => {
  expect(chipTarget(cite({}))).toEqual({ kind: "fact", reportId, markerKey: "hba1c" });
});

test("each other cited row opens its section of the report page", () => {
  expect(chipTarget(cite({ kind: "study", target: "s1" }))).toEqual({
    kind: "report",
    reportId,
    hash: "study-s1",
  });
  expect(chipTarget(cite({ kind: "finding", target: "f1" })).kind).toBe("report");
  expect(chipTarget(cite({ kind: "finding", target: "f1" }))).toMatchObject({ hash: "findings" });
  expect(chipTarget(cite({ kind: "pattern", target: "b12" }))).toMatchObject({
    hash: "pattern-b12",
  });
  expect(chipTarget(cite({ kind: "follow_up", target: "u1" }))).toMatchObject({
    hash: "move-first",
  });
  expect(chipTarget(cite({ kind: "link", target: "r2" }))).toMatchObject({ hash: "links" });
  expect(chipTarget(cite({ kind: "report", target: null }))).toEqual({ kind: "report", reportId });
});

test("an episode chip opens the episode, and a catalog chip opens nothing", () => {
  expect(chipTarget(cite({ kind: "episode", reportId: null, target: "e1" }))).toEqual({
    kind: "episode",
    episodeId: "e1",
  });
  expect(chipTarget(cite({ kind: "catalog", reportId: null }))).toEqual({ kind: "none" });
});

test("a deleted chip opens nothing and says the report is deleted", () => {
  const deleted = cite({ deleted: true, label: null, labName: null, date: null });
  expect(chipTarget(deleted)).toEqual({ kind: "none" });
  expect(chipText(deleted)).toBe("Report deleted");
});

test("the chip text names the cited row, the lab and the date", () => {
  expect(chipText(cite({}))).toBe("HbA1c · Sunrise Diagnostics · 4 Aug 2026");
  expect(chipText(cite({ kind: "link", label: null }))).toBe(
    "Repeat study · Sunrise Diagnostics · 4 Aug 2026",
  );
});
