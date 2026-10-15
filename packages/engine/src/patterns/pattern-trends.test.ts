import { describe, expect, test } from "vitest";
import fixture from "../../fixtures/dense-history.json";
import type { AttentionVisit } from "../attention.js";
import { runEngine } from "../index.js";
import type { EngineProfile, EngineValue, VisitMarker } from "../types.js";
import { buildPatternTrends } from "./pattern-trends.js";

function row(
  markerKey: string,
  value: number,
  status: VisitMarker["status"],
  [calibratedLow, calibratedHigh]: [number | null, number | null],
  unit: string,
): VisitMarker {
  return { markerKey, value, valueText: null, unit, status, calibratedLow, calibratedHigh };
}

const homocysteine = (value: number) => row("homocysteine", value, "risk", [5, 10], "µmol/L");
const b12 = (value: number, unit = "pg/mL") =>
  row("vitamin_b12", value, value < 400 ? "watch" : "optimal", [400, 900], unit);
const ferritin = row("ferritin", 80, "optimal", [30, 150], "ng/mL");
const lowHemoglobin = row("hemoglobin", 11, "watch", [13, 17], "g/dL");
const highHsCrp = row("hs_crp", 4, "watch", [0, 1], "mg/L");
const highCrp = row("crp", 12, "risk", [0, 5], "mg/L");

function visit(reportId: string, date: string, markers: VisitMarker[]): AttentionVisit {
  return { reportId, date, markers };
}

function trend(visits: AttentionVisit[], key: string) {
  return buildPatternTrends(visits).find((item) => item.key === key);
}

describe("buildPatternTrends", () => {
  test("a pattern matches on markers from different reports, each linked to the report of its latest value", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(18)]),
      visit("b", "2026-02-05", [b12(300)]),
    ];
    const match = trend(visits, "b12_deficiency");
    expect(match?.matched).toEqual([
      expect.objectContaining({ markerKey: "homocysteine", value: 18, reportId: "a" }),
      expect.objectContaining({ markerKey: "vitamin_b12", value: 300, reportId: "b" }),
    ]);
    expect(match?.change).toBe("new");
  });

  test("with one visit date a pattern has no change label", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(18)]),
      visit("b", "2026-01-05", [b12(300)]),
    ];
    expect(trend(visits, "b12_deficiency")?.change).toBeNull();
  });

  test("a matched marker that moves further from optimal makes the pattern worsening", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(15), b12(300)]),
      visit("b", "2026-03-05", [homocysteine(20)]),
    ];
    expect(trend(visits, "b12_deficiency")?.change).toBe("worsening");
  });

  test("a matched marker that moves closer to optimal makes the pattern improving", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(20), b12(300)]),
      visit("b", "2026-03-05", [homocysteine(15)]),
    ];
    expect(trend(visits, "b12_deficiency")?.change).toBe("improving");
  });

  test("a newest visit that measures none of the pattern's markers keeps it stable", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(18), b12(300)]),
      visit("b", "2026-03-05", [row("ldl_cholesterol", 90, "optimal", [0, 100], "mg/dL")]),
    ];
    expect(trend(visits, "b12_deficiency")?.change).toBe("stable");
  });

  test("one more matched condition makes the pattern worsening, one fewer makes it improving", () => {
    const three = [ferritin, lowHemoglobin, highHsCrp];
    const more = [visit("a", "2026-01-05", three), visit("b", "2026-03-05", [highCrp])];
    expect(trend(more, "anaemia_of_inflammation")?.change).toBe("worsening");

    const fewer = [
      visit("a", "2026-01-05", [...three, highCrp]),
      visit("b", "2026-03-05", [row("crp", 2, "optimal", [0, 5], "mg/L")]),
    ];
    expect(trend(fewer, "anaemia_of_inflammation")?.change).toBe("improving");
  });

  test("a ratio that rises because HDL drops makes the pattern worsening while triglycerides stay flat", () => {
    const triglycerides = row("triglycerides", 200, "watch", [0, 150], "mg/dL");
    const hdl = (value: number) => row("hdl_cholesterol", value, "watch", [40, 80], "mg/dL");
    const visits = [
      visit("a", "2026-01-05", [triglycerides, hdl(50)]),
      visit("b", "2026-03-05", [hdl(40)]),
    ];
    expect(trend(visits, "insulin_resistance")?.change).toBe("worsening");
  });

  test("a pattern that matched before and not now comes last as cleared, linked to the earlier reports", () => {
    const visits = [
      visit("a", "2026-01-05", [homocysteine(18), b12(300)]),
      visit("b", "2026-03-05", [b12(520)]),
    ];
    const trends = buildPatternTrends(visits);
    expect(trends.at(-1)).toMatchObject({
      key: "b12_deficiency",
      change: "cleared",
      matched: [
        expect.objectContaining({ markerKey: "homocysteine", reportId: "a" }),
        expect.objectContaining({ markerKey: "vitamin_b12", value: 300, reportId: "a" }),
      ],
    });
  });

  test("a B12 value in a unit the catalog does not use never meets the value condition", () => {
    const visits = [visit("a", "2026-01-05", [homocysteine(18), b12(100, "bananas")])];
    expect(trend(visits, "b12_deficiency")).toBeUndefined();
  });
});

describe("buildPatternTrends on the dense history", () => {
  const profile = fixture.profile as EngineProfile;
  const dense: AttentionVisit[] = fixture.reports.map(({ collectedAt, values }, index) => {
    const output = runEngine({ profile, values: values as EngineValue[] });
    return {
      reportId: `report-${index}`,
      date: collectedAt,
      markers: [...output.markers, ...output.derived].map((result) => ({
        markerKey: result.markerKey,
        value: typeof result.value === "number" ? result.value : null,
        valueText: null,
        unit: result.unit,
        status: result.status === "unknown" ? null : result.status,
        calibratedLow: result.calibrated?.optimalLow ?? null,
        calibratedHigh: result.calibrated?.optimalHigh ?? null,
      })),
    };
  });
  const labels = (visits: AttentionVisit[]) =>
    buildPatternTrends(visits).map(({ key, change }) => `${key} ${change}`);

  test("the lower newest HbA1c clears the lipid triad and prediabetes, and the other four stay", () => {
    expect(labels(dense)).toEqual([
      "b12_deficiency stable",
      "insulin_resistance stable",
      "fatty_liver_signal stable",
      "gout_risk stable",
      "metabolic_lipid_triad cleared",
      "prediabetes cleared",
    ]);
  });

  test("the second full panel clears the thyroid pattern and moves three others", () => {
    expect(labels(dense.slice(0, 7))).toEqual([
      "b12_deficiency stable",
      "metabolic_lipid_triad stable",
      "insulin_resistance improving",
      "prediabetes worsening",
      "fatty_liver_signal improving",
      "gout_risk stable",
      "subclinical_hypothyroidism cleared",
    ]);
  });
});
