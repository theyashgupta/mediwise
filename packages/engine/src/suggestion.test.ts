import { describe, expect, test } from "vitest";
import { derived, markers } from "./catalog/index.js";
import { hindiCopyProblems, hindiSentences } from "./catalog/text.js";
import { doctorLine, type TrendSuggestionInput, trendSuggestion } from "./suggestion.js";
import type { MarkerStatus, TrendDirection } from "./types.js";

const input = (overrides: Partial<TrendSuggestionInput>): TrendSuggestionInput => ({
  markerKey: "ldl_cholesterol",
  value: 90,
  status: "optimal",
  direction: "stable",
  optimalLow: null,
  optimalHigh: 100,
  ...overrides,
});

describe("trendSuggestion", () => {
  test("a marker without a status gets a measure suggestion", () => {
    expect(trendSuggestion(input({ status: "unknown" }))).toBe(
      "Measure LDL cholesterol again at your next blood test. Ask your doctor before you act on this.",
    );
  });

  test("a low value of a supplementable marker gets a supplement suggestion, even at risk", () => {
    const low = { markerKey: "vitamin_d", value: 12, optimalLow: 30, optimalHigh: 60 };
    expect(trendSuggestion(input({ ...low, status: "risk" }))).toBe(
      "Ask if a supplement for low Vitamin D (25-OH) suits you. Ask your doctor before you act on this.",
    );
    expect(trendSuggestion(input({ ...low, status: "watch", direction: "worsening" }))).toMatch(
      /^Ask if a supplement/,
    );
  });

  test("a high value of a supplementable marker never gets a supplement suggestion", () => {
    const high = { markerKey: "vitamin_d", value: 140, optimalLow: 30, optimalHigh: 60 };
    expect(trendSuggestion(input({ ...high, status: "risk" }))).toBe(
      "Retest Vitamin D (25-OH) in 8 to 12 weeks. Ask your doctor before you act on this.",
    );
  });

  test("a risk value gets a retest in the catalog weeks for risk, else in 8 to 12 weeks", () => {
    expect(trendSuggestion(input({ markerKey: "hba1c", value: 7, status: "risk" }))).toBe(
      "Retest HbA1c in 13 weeks. Ask your doctor before you act on this.",
    );
    expect(trendSuggestion(input({ value: 190, status: "risk", direction: "improving" }))).toBe(
      "Retest LDL cholesterol in 8 to 12 weeks. Ask your doctor before you act on this.",
    );
  });

  test("a worsening watch value gets a retest, and a worsening optimal value a measure at the next checkup", () => {
    expect(trendSuggestion(input({ value: 120, status: "watch", direction: "worsening" }))).toBe(
      "Retest LDL cholesterol in 8 to 12 weeks to see if this change continues. Ask your doctor before you act on this.",
    );
    expect(trendSuggestion(input({ direction: "worsening" }))).toBe(
      "Measure LDL cholesterol again at your next checkup to see if this change continues. Ask your doctor before you act on this.",
    );
  });

  test("a watch value that improves says it moves toward the optimal range, a stable one gets a retest", () => {
    const hba1c = { markerKey: "hba1c", value: 5.9, status: "watch" as const };
    expect(trendSuggestion(input({ ...hba1c, direction: "improving" }))).toBe(
      "HbA1c moves toward your optimal range. Retest it in 52 weeks. Ask your doctor before you act on this.",
    );
    expect(trendSuggestion(input(hba1c))).toBe(
      "Retest HbA1c in 52 weeks. Ask your doctor before you act on this.",
    );
  });

  test("an optimal value that holds or improves keeps the current habits", () => {
    for (const direction of ["stable", "improving"] as const) {
      expect(trendSuggestion(input({ direction }))).toBe(
        "Keep your current habits. Measure LDL cholesterol again at your next checkup. Ask your doctor before you act on this.",
      );
    }
  });

  test("the Hindi suggestion keeps the marker name and the catalog weeks and ends with the Hindi doctor line", () => {
    expect(trendSuggestion(input({ markerKey: "hba1c", value: 7, status: "risk" }), "hi")).toBe(
      "13 हफ़्ते में HbA1c का दोबारा टेस्ट करें। इस पर कुछ भी करने से पहले अपने डॉक्टर से पूछें।",
    );
  });

  const statuses: MarkerStatus[] = ["optimal", "watch", "risk", "unknown"];
  const directions: TrendDirection[] = ["improving", "worsening", "stable"];
  const every = [...markers, ...derived].flatMap((entry) =>
    statuses.flatMap((status) =>
      directions.flatMap((direction) =>
        [0, 100].map((value) =>
          input({
            markerKey: entry.key,
            status,
            direction,
            value,
            optimalLow: 10,
            optimalHigh: 50,
          }),
        ),
      ),
    ),
  );

  test("every suggestion of every catalog marker ends with the doctor line and names no dose or medicine", () => {
    for (const item of every) {
      for (const locale of ["en", "hi"] as const) {
        const text = trendSuggestion(item, locale);
        expect(text.endsWith(doctorLine[locale])).toBe(true);
        expect(text).not.toMatch(
          /\b(dose|dosage|medicines?|statins?|metformin|tablets?|pills?)\b|\d+ ?(mg|mcg|IU)\b/i,
        );
        expect(text).not.toMatch(/खुराक|दवा/);
      }
    }
  });

  test("every English sentence has 20 words or fewer and every Hindi suggestion follows the Hindi copy rules", () => {
    for (const item of every) {
      const english = trendSuggestion(item, "en");
      for (const sentence of hindiSentences(english)) {
        expect(sentence.split(/\s+/).length, sentence).toBeLessThanOrEqual(20);
      }
      expect(hindiCopyProblems(trendSuggestion(item, "hi"), english)).toEqual([]);
    }
  });
});
