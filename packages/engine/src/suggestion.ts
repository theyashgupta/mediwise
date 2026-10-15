import { derived, markers } from "./catalog/index.js";
import type { TextLocale } from "./catalog/text.js";
import { deviation } from "./status.js";
import type { MarkerStatus, TrendDirection } from "./types.js";

export const doctorLine: Record<TextLocale, string> = {
  en: "Ask your doctor before you act on this.",
  hi: "इस पर कुछ भी करने से पहले अपने डॉक्टर से पूछें।",
};

export type TrendSuggestionInput = {
  markerKey: string;
  value: number;
  status: MarkerStatus;
  direction: TrendDirection;
  optimalLow: number | null;
  optimalHigh: number | null;
};

type Rule =
  "measure" | "supplement" | "retest" | "retestChange" | "measureChange" | "closer" | "keep";

const catalog = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));

const copy: Record<TextLocale, Record<Rule, (name: string, weeks: string) => string>> = {
  en: {
    measure: (name) => `Measure ${name} again at your next blood test.`,
    supplement: (name) => `Ask if a supplement for low ${name} suits you.`,
    retest: (name, weeks) => `Retest ${name} in ${weeks}.`,
    retestChange: (name, weeks) => `Retest ${name} in ${weeks} to see if this change continues.`,
    measureChange: (name) =>
      `Measure ${name} again at your next checkup to see if this change continues.`,
    closer: (name, weeks) => `${name} moves toward your optimal range. Retest it in ${weeks}.`,
    keep: (name) => `Keep your current habits. Measure ${name} again at your next checkup.`,
  },
  hi: {
    measure: (name) => `अपने अगले ब्लड टेस्ट में ${name} का टेस्ट फिर से कराएँ।`,
    supplement: (name) => `पूछें कि क्या कम ${name} के लिए सप्लीमेंट आपके लिए ठीक है।`,
    retest: (name, weeks) => `${weeks} में ${name} का दोबारा टेस्ट करें।`,
    retestChange: (name, weeks) =>
      `${weeks} में ${name} का दोबारा टेस्ट करें, ताकि पता चले कि यह बदलाव जारी है या नहीं।`,
    measureChange: (name) =>
      `अगले चेकअप में ${name} का टेस्ट फिर से कराएँ, ताकि पता चले कि यह बदलाव जारी है या नहीं।`,
    closer: (name, weeks) =>
      `${name} आपकी सबसे अच्छी रेंज की ओर बढ़ रहा है। ${weeks} में इसका दोबारा टेस्ट करें।`,
    keep: (name) => `अपनी अभी की आदतें बनाए रखें। अगले चेकअप में ${name} का टेस्ट फिर से कराएँ।`,
  },
};

const defaultWeeks: Record<TextLocale, string> = { en: "8 to 12 weeks", hi: "8 से 12 हफ़्ते" };

function pickRule(
  { value, status, direction, optimalLow, optimalHigh }: TrendSuggestionInput,
  supplementable: boolean,
): Rule {
  if (status === "unknown") return "measure";
  const low = deviation(value, { optimalLow, optimalHigh }) < 0;
  if (status !== "optimal" && low && supplementable) return "supplement";
  if (status === "risk") return "retest";
  if (direction === "worsening") return status === "watch" ? "retestChange" : "measureChange";
  if (status === "watch") return direction === "improving" ? "closer" : "retest";
  return "keep";
}

/**
 * Writes the one-line suggestion for a marker trend from its latest status, direction and catalog entry.
 *
 * @remarks
 * The text comes from fixed templates and the marker name only, never from catalog prose, because `whatMovesIt` names medicines.
 * A supplement needs a low value and the catalog `supplementable` flag, the same rule as the supplement follow-up.
 * The retest weeks are the catalog interval for the status when it has one, else 8 to 12 weeks like the retest follow-up.
 */
export function trendSuggestion(input: TrendSuggestionInput, locale: TextLocale = "en"): string {
  const entry = catalog.get(input.markerKey);
  const rule = pickRule(input, entry?.supplementable === true);
  const weeks = entry?.retest?.find(({ status }) => status === input.status)?.weeks;
  const weeksText =
    weeks === undefined
      ? defaultWeeks[locale]
      : locale === "hi"
        ? `${weeks} हफ़्ते`
        : `${weeks} weeks`;
  return `${copy[locale][rule](entry?.name ?? input.markerKey, weeksText)} ${doctorLine[locale]}`;
}
