import { describe, expect, test } from "vitest";
import fixture from "../../fixtures/patterns.json";
import { derived, markers } from "../catalog/index.js";
import { runEngine } from "../index.js";
import type { EngineInput, EngineValue } from "../types.js";
import { patterns } from "./catalog.js";
import { buildDoctorQuestions } from "./run-patterns.js";

const profile = fixture.profile as EngineInput["profile"];
const cases = fixture.patterns as Record<string, { matches: EngineValue[]; misses: EngineValue[] }>;
const catalogKeys = new Set([...markers, ...derived].map((entry) => entry.key));

function matchedKeys(values: EngineValue[]) {
  return runEngine({ profile, values }).patterns.map((match) => match.key);
}

function value(markerKey: string, number: number, unit: string): EngineValue {
  return { rawName: markerKey, markerKey, value: number, unit };
}

describe("pattern fixtures", () => {
  test("every pattern has a fixture", () => {
    expect(Object.keys(cases).sort()).toEqual(patterns.map((pattern) => pattern.key).sort());
  });

  test.each(patterns.map((pattern) => pattern.key))("%s matches its matching fixture", (key) => {
    expect(matchedKeys(cases[key]!.matches)).toContain(key);
  });

  test.each(patterns.map((pattern) => pattern.key))("%s skips its missing fixture", (key) => {
    expect(matchedKeys(cases[key]!.misses)).not.toContain(key);
  });
});

describe("runPatterns", () => {
  test("a match lists each matched condition with the marker name and value", () => {
    const [match] = runEngine({ profile, values: cases.b12_deficiency!.matches }).patterns;
    expect(match?.matched).toEqual([
      { markerKey: "homocysteine", name: "Homocysteine", value: 23.6, unit: "µmol/L" },
      { markerKey: "vitamin_b12", name: "Vitamin B12", value: 388.9, unit: "pg/mL" },
    ]);
  });

  test("a ratio condition reports the computed ratio against the numerator marker", () => {
    const output = runEngine({
      profile,
      values: [value("triglycerides", 180, "mg/dL"), value("hdl_cholesterol", 40, "mg/dL")],
    });
    const match = output.patterns.find((item) => item.key === "insulin_resistance");
    expect(match?.matched).toEqual([
      expect.objectContaining({ markerKey: "triglycerides", value: 4.5, unit: "ratio" }),
    ]);
  });

  test("a value in a unit the catalog cannot convert never matches a value condition", () => {
    const values = [value("homocysteine", 23.6, "µmol/L"), value("vitamin_b12", 100, "bananas")];
    expect(matchedKeys(values)).not.toContain("b12_deficiency");
  });

  test("risk patterns come before watch patterns", () => {
    const values = [...cases.gout_risk!.matches, ...cases.b12_deficiency!.matches];
    expect(matchedKeys(values)).toEqual(["b12_deficiency", "gout_risk"]);
  });
});

describe("doctor questions", () => {
  test("pattern questions come first, then one question per risk marker", () => {
    const output = runEngine({ profile, values: cases.b12_deficiency!.matches });
    expect(output.doctorQuestions).toEqual([
      ...patterns.find((pattern) => pattern.key === "b12_deficiency")!.askDoctor,
      "My Homocysteine is 23.6 µmol/L. Should we retest or investigate?",
    ]);
  });

  test("repeated questions appear once and the list stops at 8", () => {
    const repeated = { askDoctor: ["Same question?", "Same question?"] };
    const many = Array.from({ length: 10 }, (_, index) => ({ askDoctor: [`Question ${index}?`] }));
    expect(buildDoctorQuestions([], [repeated])).toEqual(["Same question?"]);
    expect(buildDoctorQuestions([], many)).toHaveLength(8);
  });
});

describe("pattern catalog", () => {
  test("the catalog has at least 15 patterns with unique keys", () => {
    const keys = patterns.map((pattern) => pattern.key);
    expect(keys.length).toBeGreaterThanOrEqual(15);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("every condition names a catalog marker and every pattern has a source", () => {
    for (const pattern of patterns) {
      expect(pattern.sources.length, pattern.key).toBeGreaterThan(0);
      expect(pattern.askDoctor.length, pattern.key).toBeGreaterThan(0);
      expect(pattern.minMatches, pattern.key).toBeGreaterThan(0);
      expect(pattern.minMatches, pattern.key).toBeLessThanOrEqual(pattern.conditions.length);
      for (const condition of pattern.conditions) {
        expect(catalogKeys, pattern.key).toContain(condition.markerKey);
        if (condition.comparator === "ratio_above") {
          expect(catalogKeys, pattern.key).toContain(condition.denominatorKey);
        }
      }
    }
  });

  test("pattern copy has no semicolon, no sentence over 20 words and no diagnosis words", () => {
    const problems = patterns.flatMap((pattern) =>
      [pattern.description, pattern.whatItSuggests, pattern.whatToDo, ...pattern.askDoctor].filter(
        (text) =>
          text.includes(";") ||
          /\byou have\b|\bdiagnos|\bdisease\b/i.test(text) ||
          text.split(/[.!?](?=\s|$)/).some((sentence) => sentence.trim().split(/\s+/).length > 20),
      ),
    );
    expect(problems).toEqual([]);
  });
});
