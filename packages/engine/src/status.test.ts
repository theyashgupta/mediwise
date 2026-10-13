import { describe, expect, test } from "vitest";
import { findMarker } from "./catalog/index.js";
import { assess, deviation, matchRange, selectRange, trendDirection } from "./status.js";
import type { CalibratedRange, EngineProfile, MarkerStatus } from "./types.js";

const adult: EngineProfile = { ageYears: 40, sex: "male", ancestry: "european" };
const southAsian: EngineProfile = { ...adult, ancestry: "south_asian" };
const ldl = findMarker("ldl cholesterol")!;

function status(rawName: string, value: number, profile = adult, labRange?: CalibratedRange) {
  const entry = findMarker(rawName)!;
  const range = labRange && { low: labRange.optimalLow, high: labRange.optimalHigh };
  return assess(
    { entry, value, unit: entry.unit, canonical: true, ...(range && { labRange: range }) },
    profile,
  ).result;
}

describe("selectRange", () => {
  test("an ancestry range wins over the general range", () => {
    expect(selectRange(ldl, southAsian)?.ancestry).toBe("south_asian");
    expect(selectRange(ldl, adult)?.ancestry).toBeUndefined();
  });

  test("a child gets no adult range", () => {
    expect(selectRange(ldl, { ...adult, ageYears: 10 })).toBeUndefined();
  });
});

describe("matchRange", () => {
  const row = (value: number, status: MarkerStatus) => ({
    value,
    status,
    optimal: [null, 99] as [null, number],
  });

  test("a stored row finds the range with the same band, the profile's ancestry first", () => {
    expect(matchRange(ldl, southAsian, row(90, "optimal"))?.watch).toEqual([null, 129]);
    expect(matchRange(ldl, adult, row(90, "optimal"))?.watch).toEqual([null, 159]);
  });

  test("a range that contradicts the stored status is skipped after a profile change", () => {
    expect(matchRange(ldl, southAsian, row(140, "watch"))?.watch).toEqual([null, 159]);
  });

  test("a band from the lab range matches no catalog range", () => {
    expect(
      matchRange(ldl, adult, { value: 90, status: "optimal", optimal: [0, 130] }),
    ).toBeUndefined();
  });
});

describe("assess", () => {
  test("optimal, watch and risk follow the calibrated bands", () => {
    expect(status("ldl", 90).status).toBe("optimal");
    expect(status("ldl", 140).status).toBe("watch");
    expect(status("ldl", 140, southAsian).status).toBe("risk");
  });

  test("a value with no calibrated range uses the lab range", () => {
    const lab = { optimalLow: 0, optimalHigh: 130, watchLow: 0, watchHigh: 130, source: "lab" };
    const child = { ...adult, ageYears: 10 };
    expect(status("ldl", 140, child, lab)).toMatchObject({ status: "risk" });
    expect(status("ldl", 140, child).status).toBe("unknown");
  });

  test("an unknown unit gives status unknown", () => {
    const result = assess({ entry: ldl, value: 3, unit: "furlongs", canonical: false }, adult);
    expect(result.result).toMatchObject({ status: "unknown", calibrated: null, deviation: 0 });
  });
});

describe("text results", () => {
  function textStatus(rawName: string, text: string) {
    const entry = findMarker(rawName)!;
    return assess({ entry, value: text, unit: "", canonical: false }, adult).result;
  }

  test.each([
    ["HBsAg", "Reactive", "risk"],
    ["HBsAg", "Weakly reactive", "risk"],
    ["HBsAg", "Non Reactive", "optimal"],
    ["HBsAg", "Non-reactive", "optimal"],
    ["HBsAg", "Negative", "optimal"],
    ["HCV, IgG", "POSITIVE", "risk"],
    ["HCV, IgG", "NON REACTIVE", "optimal"],
    ["HCV, IgG", "Nonreactive", "optimal"],
    ["HCV, IgG", "Equivocal", "unknown"],
    ["Anti Hbs Titre", "<2.0", "watch"],
    ["Anti Hbs Titre", "< 10", "watch"],
    ["Anti Hbs Titre", "<100", "unknown"],
    ["Anti Hbs Titre", ">1000", "unknown"],
    ["Urine Colour", "PALE YELLOW", "unknown"],
    ["Peripheral Smear Examination - Hemoparasite", "No hemoparasite seen", "unknown"],
  ])("%s printed as %j gives status %s", (rawName, text, expected) => {
    expect(textStatus(rawName, text)).toMatchObject({
      value: text,
      status: expected,
      calibrated: null,
      deviation: 0,
    });
  });

  test("a numeric anti-HBs under 10 is watch at any age, and 10 or more is optimal", () => {
    const child = { ...adult, ageYears: 5 };
    expect(status("anti hbs", 4, child).status).toBe("watch");
    expect(status("anti hbs", 0, adult).status).toBe("watch");
    expect(status("anti hbs", 10, adult).status).toBe("optimal");
  });
});

describe("deviation", () => {
  const closed: CalibratedRange = {
    optimalLow: 30,
    optimalHigh: 100,
    watchLow: 20,
    watchHigh: 150,
    source: "x",
  };

  test("inside optimal is zero, below is negative, above is positive", () => {
    expect(deviation(50, closed)).toBe(0);
    expect(deviation(16, closed)).toBe(-0.2);
    expect(deviation(135, closed)).toBe(0.5);
  });

  test("a one-sided range measures against the bound itself", () => {
    expect(deviation(150, { ...closed, optimalLow: null })).toBe(0.5);
  });
});

describe("trendDirection", () => {
  const band = { low: 135, high: 145 };

  test("a marker that is bad both ways improves when it moves toward the optimal range", () => {
    expect(trendDirection("both", 130, 133, 0, band)).toBe("improving");
    expect(trendDirection("both", 150, 155, 0, band)).toBe("worsening");
    expect(trendDirection("both", 138, 142, 0, band)).toBe("stable");
  });

  test("a move that stays inside the optimal range is stable, whatever the direction", () => {
    expect(trendDirection("high_is_bad", 0.4, 0, 1, { low: null, high: 1 })).toBe("stable");
    expect(trendDirection("both", 158.6, 75, 1, { low: 65, high: 175 })).toBe("stable");
    expect(trendDirection("low_is_bad", 62, 80, 0, { low: 60, high: null })).toBe("stable");
  });

  test("a one-sided marker improves toward its optimal range and worsens away from it", () => {
    expect(trendDirection("high_is_bad", 131, 106, 0, { low: null, high: 99 })).toBe("improving");
    expect(trendDirection("high_is_bad", 0.4, 1.4, 1, { low: null, high: 1 })).toBe("worsening");
    expect(trendDirection("low_is_bad", 45, 38, 0, { low: 60, high: null })).toBe("worsening");
  });

  test("without an optimal range the catalog direction decides", () => {
    const open = { low: null, high: null };
    expect(trendDirection("high_is_bad", 131, 106, 0, open)).toBe("improving");
    expect(trendDirection("low_is_bad", 131, 106, 0, open)).toBe("worsening");
    expect(trendDirection("both", 131, 106, 0, open)).toBe("stable");
  });

  test("two values that look the same at the marker precision are stable", () => {
    const tsh = { low: 0.45, high: 4.12 };
    expect(trendDirection("both", 5.41, 5.44, 1, tsh)).toBe("stable");
    expect(trendDirection("both", 5.41, 5.46, 1, tsh)).toBe("worsening");
  });
});
