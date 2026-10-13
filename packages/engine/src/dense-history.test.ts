import { describe, expect, test } from "vitest";
import fixture from "../fixtures/dense-history.json";
import { buildFindings } from "./findings.js";
import { runEngine } from "./index.js";
import type { EngineProfile, EngineValue, Visit } from "./types.js";

const profile = fixture.profile as EngineProfile;
const visits: Visit[] = fixture.reports.map(({ collectedAt, labName, values }) => ({
  date: collectedAt,
  labName,
  studies: [],
  markers: runEngine({ profile, values: values as EngineValue[] }).markers.map((result) => ({
    markerKey: result.markerKey,
    value: typeof result.value === "number" ? result.value : null,
    valueText: typeof result.value === "number" ? null : result.value,
    unit: result.unit,
    status: result.status === "unknown" ? null : result.status,
    calibratedLow: result.calibrated?.optimalLow ?? null,
    calibratedHigh: result.calibrated?.optimalHigh ?? null,
  })),
}));

/** Gives the visits before one index, newest first, as the API loads them. */
function earlierThan(index: number) {
  return visits.slice(0, index).toReversed();
}

describe("a profile with 12 reports in 10 weeks", () => {
  test("the fixture holds 12 reports from 11 dates in 10 weeks", () => {
    const dates = fixture.reports.map(({ collectedAt }) => collectedAt);
    expect(dates).toHaveLength(12);
    expect(new Set(dates).size).toBe(11);
    expect((Date.parse(dates.at(-1)!) - Date.parse(dates[0]!)) / 86_400_000).toBe(70);
  });

  test("the second full panel compares with the first one, past the narrow reports between them", () => {
    const { findings } = buildFindings(visits[6]!, earlierThan(6), []);
    const titles = findings.filter(({ kind }) => kind === "change").map(({ title }) => title);
    expect(titles).toEqual([
      "HbA1c worsening: 5.9 % on 1 Sep 2026, 6.1 % on 15 Sep 2026",
      "Triglycerides improving: 238 mg/dL in Aug 2026, 182 mg/dL in Sep 2026",
      "Thyroid stimulating hormone improving: 5.8 µIU/mL in Aug 2026, 4.1 µIU/mL in Sep 2026",
      "Vitamin D (25-OH) improving: 14.2 ng/mL in Aug 2026, 31 ng/mL in Sep 2026",
    ]);
  });

  test("the last report compares HbA1c with the full panel four weeks before", () => {
    const { findings } = buildFindings(visits[11]!, earlierThan(11), []);
    expect(findings.find(({ citedKeys }) => citedKeys[0] === "hba1c")?.title).toMatch(
      /^HbA1c improving: 6\.1 % in Sep 2026, 5\.6 % in Oct 2026$/,
    );
  });
});
