import type { Pattern } from "../types.js";
import { hindiMarkerText, hindiPatternText } from "./hi/index.js";
import type { Marker } from "./schema.js";

export const textLocales = ["en", "hi"] as const;
export type TextLocale = (typeof textLocales)[number];

export type FollowUpText = { title: string; why: string; next: string };

export type MarkerText = Pick<
  Marker,
  "description" | "whatItIs" | "whyItMatters" | "whatMovesIt" | "southAsianNote"
> & { textRuleFollowUps?: FollowUpText[] };

/**
 * Returns the copy of a catalog entry in a locale, or the English copy when the locale has none.
 *
 * @remarks
 * English returns the entry's own fields, so the English path reads exactly the strings it read before Hindi existed.
 */
export function markerText(entry: Marker, locale: TextLocale): MarkerText {
  const hindi = locale === "hi" ? hindiMarkerText[entry.key] : undefined;
  if (hindi) return hindi;
  const { description, whatItIs, whyItMatters, whatMovesIt, southAsianNote } = entry;
  return {
    description,
    whatItIs,
    whyItMatters,
    whatMovesIt,
    southAsianNote,
    textRuleFollowUps: entry.textRules?.flatMap(({ followUp }) => (followUp ? [followUp] : [])),
  };
}

export type PatternText = Pick<Pattern, "name" | "description" | "whatItSuggests" | "whatToDo">;

/** Returns the copy of a pattern in a locale, or the English copy when the locale has none. */
export function patternText(pattern: PatternText & { key: string }, locale: TextLocale): PatternText {
  const hindi = locale === "hi" ? hindiPatternText[pattern.key] : undefined;
  if (hindi) return hindi;
  const { name, description, whatItSuggests, whatToDo } = pattern;
  return { name, description, whatItSuggests, whatToDo };
}

/** Splits Hindi or English text into sentences on a full stop, a danda, a question mark or an exclamation mark. */
export function hindiSentences(text: string): string[] {
  return text
    .split(/(?<=[.।?!])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Counts the words of a Hindi sentence that contain Devanagari.
 *
 * @remarks
 * Printed names (HbA1c, LDL) and numbers stay in Latin script, so they do not count toward the 20-word limit.
 */
export function devanagariWordCount(sentence: string): number {
  return sentence.split(/\s+/).filter((word) => /\p{Script=Devanagari}/u.test(word)).length;
}

const hedgeEn = /\b(may|might|can|could|often|usually|likely|possible)\b/i;
const hedgeHi = /सक(?:त|े|ी|ा)|संभव|शायद|अक्सर|आम तौर|आमतौर|ज़्यादातर|ज्यादातर|कभी-कभी|संकेत|लगभग/;

/**
 * Lists every way a Hindi text breaks the Hindi copy rules, measured against its English source.
 *
 * @remarks
 * The hedge check works on the whole text: an English hedge word needs a Hindi hedge word somewhere in the translation.
 * Each Latin-script printed name of the source must appear unchanged, so a lab noun is never translated.
 */
export function hindiCopyProblems(hindi: string, english: string, printedNames: string[] = []) {
  const problems: string[] = [];
  if (!/\p{Script=Devanagari}/u.test(hindi)) problems.push("has no Devanagari");
  if (/[०-९]/.test(hindi)) problems.push("uses Devanagari digits");
  if (hindi.includes(";")) problems.push("has a semicolon");
  for (const sentence of hindiSentences(hindi)) {
    const words = devanagariWordCount(sentence);
    if (words > 20) problems.push(`has a sentence of ${words} Hindi words: ${sentence}`);
  }
  if (hedgeEn.test(english) && !hedgeHi.test(hindi)) problems.push("drops a hedge");
  const acronyms = english.match(/\b[A-Za-z]*[A-Z][a-z]*[A-Z0-9][A-Za-z0-9]*\b/g) ?? [];
  for (const name of new Set(acronyms)) {
    if (!hindi.includes(name)) problems.push(`drops "${name}"`);
  }
  for (const name of printedNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const has = (text: string) => new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, "i").test(text);
    if (has(english) && !has(hindi)) problems.push(`drops "${name}"`);
  }
  const numbers = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).toSorted();
  if (numbers(hindi).join(" ") !== numbers(english).join(" ")) {
    problems.push(`changes the numbers ${numbers(english).join(" ")}`);
  }
  return problems;
}
