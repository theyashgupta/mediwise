import { describe, expect, test } from "vitest";
import { hindiLifestyleText } from "./hi/index.js";
import {
  derived,
  lifestyle,
  lifestyleSchema,
  hindiCopyProblems,
  lifestyleText,
  markers,
  type Marker,
  urgentLimits,
  urgentLimitSchema,
} from "./index.js";

const catalog = new Map<string, Marker>(
  [...markers, ...derived].map((entry) => [entry.key, entry]),
);
const sourceIds = (key: string) => new Set(catalog.get(key)?.sources.map(({ id }) => id));

describe("lifestyle lines", () => {
  test.each(Object.entries(lifestyle))(
    "%s parses, is a catalog marker and cites one of its own sources",
    (key, entry) => {
      expect(lifestyleSchema.safeParse(entry).success).toBe(true);
      expect(catalog.has(key)).toBe(true);
      expect(sourceIds(key)).toContain(entry.source);
    },
  );

  test.each(Object.entries(lifestyle))(
    "%s addresses a side that the marker can be bad on",
    (key, { side }) => {
      const direction = catalog.get(key)?.direction;
      expect(
        direction === "both" || direction === (side === "high" ? "high_is_bad" : "low_is_bad"),
      ).toBe(true);
    },
  );

  test("every line is one short sentence or phrase with no semicolon", () => {
    const lines = Object.values(lifestyle).flatMap(({ habits, raises, lowers }) => [
      ...habits,
      ...raises,
      ...lowers,
    ]);
    for (const line of lines) {
      expect(line.split(/\s+/).length, line).toBeLessThanOrEqual(20);
      expect(line, line).not.toContain(";");
    }
  });

  test("an entry with 4 habits or no source fails the schema", () => {
    const base = { side: "high", habits: ["a"], raises: ["b"], lowers: ["c"], source: "ada2025" };
    expect(lifestyleSchema.safeParse({ ...base, habits: ["a", "b", "c", "d"] }).success).toBe(
      false,
    );
    expect(lifestyleSchema.safeParse({ ...base, source: "" }).success).toBe(false);
    expect(lifestyleSchema.safeParse({ ...base, habits: [] }).success).toBe(false);
  });
});

describe("urgent limits", () => {
  test.each(Object.entries(urgentLimits))("%s parses and cites its own sources", (key, limit) => {
    expect(urgentLimitSchema.safeParse(limit).success).toBe(true);
    for (const { source } of [limit.below, limit.above].flatMap((side) => side ?? [])) {
      expect(sourceIds(key)).toContain(source);
    }
  });

  test.each(Object.entries(urgentLimits))(
    "%s sits outside the watch interval of every range",
    (key, { below, above }) => {
      for (const { watch } of catalog.get(key)?.ranges ?? []) {
        if (below) expect(below.value).toBeLessThanOrEqual(watch[0] ?? -Infinity);
        if (above) expect(above.value).toBeGreaterThanOrEqual(watch[1] ?? Infinity);
      }
    },
  );

  test("a limit with neither side fails the schema", () => {
    expect(urgentLimitSchema.safeParse({}).success).toBe(false);
  });
});

describe("Hindi lifestyle lines", () => {
  test("every lifestyle entry has a Hindi entry with the same number of lines, and no other key has one", () => {
    expect(Object.keys(hindiLifestyleText).toSorted()).toEqual(Object.keys(lifestyle).toSorted());
    for (const [key, { habits, raises, lowers }] of Object.entries(lifestyle)) {
      const hindi = hindiLifestyleText[key];
      expect([hindi?.habits.length, hindi?.raises.length, hindi?.lowers.length], key).toEqual([
        habits.length,
        raises.length,
        lowers.length,
      ]);
    }
  });

  test("every Hindi line follows the Hindi copy rules against its English line", () => {
    const problems = Object.keys(lifestyle).flatMap((key) => {
      const english = lifestyleText(key, "en")!;
      const hindi = lifestyleText(key, "hi")!;
      return (["habits", "raises", "lowers"] as const).flatMap((field) =>
        english[field].flatMap((line, index) =>
          hindiCopyProblems(hindi[field][index] ?? "", line).map(
            (problem) => `${key}.${field}[${index}]: ${problem}`,
          ),
        ),
      );
    });
    expect(problems).toEqual([]);
  });

  test("a Hindi line that drops a hedge or a printed name is a copy problem", () => {
    expect(hindiCopyProblems("लिवर को मदद मिलती है।", "It can help your liver.")).toContain(
      "drops a hedge",
    );
    expect(hindiCopyProblems("कम कोलेस्ट्रॉल।", "Less LDL.")).toContain('drops "LDL"');
  });

  test("a marker with no lifestyle lines has none in either locale", () => {
    expect(lifestyleText("basophils_pct", "en")).toBeUndefined();
    expect(lifestyleText("basophils_pct", "hi")).toBeUndefined();
  });
});
