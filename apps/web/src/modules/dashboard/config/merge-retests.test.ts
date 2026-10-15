import { describe, expect, test } from "vitest";
import type { Suggestion } from "../types";
import { mergeRetests } from "./merge-retests";

const today = new Date(2026, 9, 15);

function proposed(markerKey: string, dueOn: string, date: string): Suggestion {
  return {
    kind: "retest",
    markerKeys: [markerKey],
    markers: [
      {
        markerKey,
        name: `${markerKey} name`,
        value: 1,
        unit: "x",
        reportId: "r1",
      },
    ],
    reportId: "r1",
    date,
    dueOn,
    sources: [],
    title: `Retest your ${markerKey}`,
    why: `Your latest ${markerKey} is well outside your calibrated range.`,
    next: "Book a retest.",
    disclaimer: "MediWise is for information. Ask your doctor before you act on this.",
    rank: 1,
  };
}

describe("mergeRetests", () => {
  test("a proposed retest replaces the scheduled date of the same marker and keeps its reason", () => {
    const rows = mergeRetests(
      [{ markerKey: "ferritin", name: "Ferritin", dueOn: "2027-03-01", measuredOn: "2026-03-01" }],
      [proposed("ferritin", "2026-11-20", "2026-10-01")],
      today,
    );
    expect(rows).toEqual([
      {
        markerKey: "ferritin",
        name: "ferritin name",
        dueOn: "2026-11-20",
        measuredOn: "2026-10-01",
        why: "Your latest ferritin is well outside your calibrated range.",
      },
    ]);
  });

  test("a scheduled date of a marker measured in the last 30 days drops out, a proposed one stays", () => {
    const rows = mergeRetests(
      [{ markerKey: "hba1c", name: "HbA1c", dueOn: "2027-01-01", measuredOn: "2026-10-05" }],
      [proposed("ferritin", "2026-11-20", "2026-10-10")],
      today,
    );
    expect(rows.map(({ markerKey }) => markerKey)).toEqual(["ferritin"]);
  });

  test("rows sort by due date, soonest first, and other suggestion kinds add no row", () => {
    const rows = mergeRetests(
      [
        { markerKey: "ldl", name: "LDL", dueOn: "2027-02-01", measuredOn: "2026-02-01" },
        { markerKey: "tsh", name: "TSH", dueOn: "2026-12-01", measuredOn: "2026-06-01" },
      ],
      [
        proposed("ferritin", "2027-01-10", "2026-09-01"),
        { ...proposed("homocysteine", "2026-11-01", "2026-09-01"), kind: "habit" },
      ],
      today,
    );
    expect(rows.map(({ markerKey }) => markerKey)).toEqual(["tsh", "ferritin", "ldl"]);
  });
});
