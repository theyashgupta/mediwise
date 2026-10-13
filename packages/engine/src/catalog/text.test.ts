import { describe, expect, test } from "vitest";
import { patterns } from "../patterns/catalog.js";
import { hindiMarkerText, hindiPatternText } from "./hi/index.js";
import { derived, markers, studyMarkers } from "./index.js";
import { devanagariWordCount, hindiCopyProblems, markerText, patternText } from "./text.js";

const entries = [...markers, ...derived, ...studyMarkers];
const fields = ["description", "whatItIs", "whyItMatters", "whatMovesIt"] as const;

describe("Hindi catalog text", () => {
  test("every marker has all four Hindi fields, and a South Asian note when English has one", () => {
    const missing = entries.flatMap((entry) => {
      const hindi = hindiMarkerText[entry.key];
      if (!hindi) return [`${entry.key}: no Hindi text`];
      const gaps = fields.filter((field) => !hindi[field]?.trim());
      if (entry.southAsianNote && !hindi.southAsianNote) gaps.push("southAsianNote" as never);
      const rules = entry.textRules?.filter(({ followUp }) => followUp) ?? [];
      if (rules.length !== (hindi.textRuleFollowUps?.length ?? 0)) gaps.push("textRuleFollowUps" as never);
      return gaps.map((field) => `${entry.key}: ${field}`);
    });
    expect(missing).toEqual([]);
  });

  test("no Hindi text belongs to a key that is not in the catalog", () => {
    const keys = new Set(entries.map((entry) => entry.key));
    expect(Object.keys(hindiMarkerText).filter((key) => !keys.has(key))).toEqual([]);
    const patternKeys = new Set(patterns.map((pattern) => pattern.key));
    expect(Object.keys(hindiPatternText).filter((key) => !patternKeys.has(key))).toEqual([]);
  });

  test("every Hindi field follows the copy rules and keeps the printed names, numbers and hedges", () => {
    const problems = entries.flatMap((entry) => {
      const hindi = hindiMarkerText[entry.key];
      if (!hindi) return [];
      const names = [entry.shortName ?? entry.name];
      const pairs: [string, string | undefined, string | undefined][] = [
        ...fields.map((field) => [field, entry[field], hindi[field]] as [string, string, string]),
        ["southAsianNote", entry.southAsianNote, hindi.southAsianNote],
        ...(entry.textRules ?? [])
          .flatMap(({ followUp }) => (followUp ? [followUp] : []))
          .flatMap((followUp, i) =>
            (["title", "why", "next"] as const).map(
              (part) =>
                [`rule ${i} ${part}`, followUp[part], hindi.textRuleFollowUps?.[i]?.[part]] as [
                  string,
                  string,
                  string | undefined,
                ],
            ),
          ),
      ];
      return pairs.flatMap(([field, english, text]) =>
        english && text
          ? hindiCopyProblems(text, english, names).map((problem) => `${entry.key} ${field}: ${problem}`)
          : [],
      );
    });
    expect(problems).toEqual([]);
  });

  test("every pattern has Hindi text that follows the copy rules", () => {
    const problems = patterns.flatMap((pattern) => {
      const hindi = hindiPatternText[pattern.key];
      if (!hindi) return [`${pattern.key}: no Hindi text`];
      return (["name", "description", "whatItSuggests", "whatToDo"] as const).flatMap((field) =>
        hindiCopyProblems(hindi[field], pattern[field]).map(
          (problem) => `${pattern.key} ${field}: ${problem}`,
        ),
      );
    });
    expect(problems).toEqual([]);
  });

  test("Hindi descriptions are one line under 90 characters", () => {
    const long = Object.entries(hindiMarkerText).filter(
      ([, text]) => text.description.length >= 90 || text.description.includes("\n"),
    );
    expect(long.map(([key]) => key)).toEqual([]);
  });
});

describe("English path", () => {
  test("English marker text is the catalog entry's own strings", () => {
    for (const entry of entries) {
      const text = markerText(entry, "en");
      for (const field of fields) expect(text[field]).toBe(entry[field]);
      expect(text.southAsianNote).toBe(entry.southAsianNote);
    }
  });

  test("English pattern text is the pattern's own strings", () => {
    for (const pattern of patterns) {
      const { name, description, whatItSuggests, whatToDo } = pattern;
      expect(patternText(pattern, "en")).toEqual({ name, description, whatItSuggests, whatToDo });
    }
  });
});

describe("Hindi copy checks", () => {
  test("a Hindi sentence over 20 Devanagari words is rejected", () => {
    const sentence = `${Array.from({ length: 21 }, () => "शब्द").join(" ")}।`;
    expect(devanagariWordCount(sentence)).toBe(21);
    expect(hindiCopyProblems(sentence, "A sentence.")).toEqual([
      expect.stringContaining("21 Hindi words"),
    ]);
  });

  test("printed names and numbers in Latin script do not count as Hindi words", () => {
    expect(devanagariWordCount("आपका LDL cholesterol 162 mg/dL है।")).toBe(2);
  });

  test("a dropped hedge, a dropped printed name and a changed number are rejected", () => {
    expect(hindiCopyProblems("TSH कम है।", "TSH may be low.")).toEqual(["drops a hedge"]);
    expect(hindiCopyProblems("एलडीएल ज़्यादा है।", "LDL is high.")).toEqual(['drops "LDL"']);
    expect(hindiCopyProblems("8 हफ़्ते में दोबारा टेस्ट करें।", "Retest in 12 weeks.")).toEqual([
      "changes the numbers 12",
    ]);
  });

  test("a semicolon and Devanagari digits are rejected", () => {
    expect(hindiCopyProblems("TSH कम है; दोबारा जाँचें।", "TSH is low.")).toEqual([
      "has a semicolon",
    ]);
    expect(hindiCopyProblems("१२ हफ़्ते।", "12 weeks.")).toEqual(
      expect.arrayContaining(["uses Devanagari digits"]),
    );
  });
});
