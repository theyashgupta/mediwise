import { describe, expect, test } from "vitest";
import type { AttentionVisit } from "./attention.js";
import {
  derived,
  devanagariWordCount,
  hindiSentences,
  lifestyle,
  lifestyleText,
  markers,
  textLocales,
  type TextLocale,
  urgentLimits,
} from "./catalog/index.js";
import { studyKindNames } from "./findings.js";
import { forbiddenWords } from "./forbidden-words.js";
import { trendSuggestion } from "./suggestion.js";
import { buildSuggestions } from "./suggestions.js";
import type { Suggestion, VisitMarker } from "./types.js";

const entries = [...markers, ...derived];
const studyKinds = [...Object.values(studyKindNames), "test"];
const printedLine =
  "Grade II fatty liver. Suspicious mass, malignancy not excluded. Take metformin 500 mg.";

type Scenario = (entry: (typeof entries)[number]) => VisitMarker | undefined;

const scenarios: Record<string, Scenario> = {
  "watch high": ({ key, unit }) => row(key, 25, "watch", unit),
  "risk high": ({ key, unit }) => row(key, 40, "risk", unit),
  "watch low": ({ key, unit }) => row(key, 8, "watch", unit),
  "risk low": ({ key, unit }) => row(key, 2, "risk", unit),
  "urgent high": ({ key, unit }) => {
    const above = urgentLimits[key]?.above;
    return above && row(key, above.value + 1, "risk", unit);
  },
  "urgent low": ({ key, unit }) => {
    const below = urgentLimits[key]?.below;
    return below && row(key, below.value - 1, "risk", unit);
  },
};

function row(
  markerKey: string,
  value: number,
  status: "watch" | "risk",
  unit: string,
): VisitMarker {
  return { markerKey, value, valueText: null, unit, status, calibratedLow: 10, calibratedHigh: 20 };
}

function readable({ title, why, next, disclaimer, habits, raises, lowers }: Suggestion) {
  return [title, why, next, disclaimer, ...(habits ?? []), ...(raises ?? []), ...(lowers ?? [])];
}

/**
 * Renders the suggestions for every catalog marker in every scenario, alone and all together, plus one stored alert per study kind.
 *
 * @remarks
 * Alerts use the stored title shape, which quotes the printed line, so the sweep fails if that line ever reaches the text.
 */
function renderAll(locale: TextLocale): Suggestion[] {
  const alerts = studyKinds.map((kind, index) => ({
    reportId: `study-${index}`,
    date: "2026-03-01",
    title: `Your ${kind} report says: "${printedLine}"`,
  }));
  return Object.values(scenarios).flatMap((scenario) => {
    const rows = entries.flatMap((entry) => scenario(entry) ?? []);
    const visit = (markers: VisitMarker[]): AttentionVisit[] => [
      { reportId: "report", date: "2026-03-01", markers },
    ];
    return [
      ...buildSuggestions(visit(rows), alerts, locale),
      ...rows.flatMap((one) => buildSuggestions(visit([one]), [], locale)),
    ];
  });
}

describe("forbidden words", () => {
  test.each(textLocales)("no %s lifestyle line in the catalog has a forbidden word", (locale) => {
    const found = Object.keys(lifestyle).flatMap((key) => {
      const { habits, raises, lowers } = lifestyleText(key, locale)!;
      return [...habits, ...raises, ...lowers].flatMap((line) =>
        forbiddenWords(line).map((word) => `${key}: "${word}" in ${line}`),
      );
    });
    expect(found).toEqual([]);
  });

  test.each(textLocales)(
    "no %s suggestion for any catalog marker, at any status and side, or for any alert, has a forbidden word",
    (locale) => {
      const suggestions = renderAll(locale);
      const kinds = new Set(suggestions.map(({ kind }) => kind));
      expect([...kinds].toSorted()).toEqual([
        "doctor_now",
        "doctor_soon",
        "habit",
        "retest",
        "supplement_ask",
      ]);
      const found = suggestions.flatMap((suggestion) =>
        readable(suggestion).flatMap((line) =>
          forbiddenWords(line).map((word) => `${suggestion.kind}: "${word}" in ${line}`),
        ),
      );
      expect(found).toEqual([]);
    },
  );

  test.each(textLocales)("every %s suggestion sentence has 20 words or fewer", (locale) => {
    const long = renderAll(locale).flatMap((suggestion) =>
      readable(suggestion).flatMap((text) =>
        hindiSentences(text).filter((sentence) =>
          locale === "hi" ? devanagariWordCount(sentence) > 20 : sentence.split(/\s+/).length > 20,
        ),
      ),
    );
    expect([...new Set(long)]).toEqual([]);
  });

  test.each(textLocales)(
    "no %s trend suggestion for any catalog marker, status and direction has a forbidden word",
    (locale) => {
      const found = entries.flatMap(({ key }) =>
        (["optimal", "watch", "risk", "unknown"] as const).flatMap((status) =>
          (["improving", "worsening", "stable"] as const).flatMap((direction) =>
            [5, 25].flatMap((value) => {
              const line = trendSuggestion(
                { markerKey: key, value, status, direction, optimalLow: 10, optimalHigh: 20 },
                locale,
              );
              return forbiddenWords(line).map((word) => `${key}: "${word}" in ${line}`);
            }),
          ),
        ),
      );
      expect(found).toEqual([]);
    },
  );

  test("the matcher finds a dose, a medicine, a diet plan and a diagnosis in English and Hindi", () => {
    expect(forbiddenWords("Take a 500 mg dose of metformin.")).toEqual(["mg", "dose", "metformin"]);
    expect(forbiddenWords("Start a statin and follow a diet plan.")).toEqual(["statin", "diet"]);
    expect(forbiddenWords("You have diabetes and a vitamin D deficiency.")).toEqual([
      "You have",
      "diabetes",
      "deficiency",
    ]);
    expect(forbiddenWords("रोज़ एक गोली लें। यह दवा मधुमेह के लिए है।")).toEqual([
      "गोली",
      "दवा",
      "मधुमेह",
    ]);
  });

  test("the matcher leaves marker names and plain habits alone", () => {
    expect(forbiddenWords("Fasting insulin, Urine ketones, HbA1c and Vitamin D (25-OH)")).toEqual(
      [],
    );
    expect(forbiddenWords("Walk briskly or do other activity on most days of the week.")).toEqual(
      [],
    );
  });
});
