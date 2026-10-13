import { categories, derived, markers, studyMarkers } from "./catalog/index.js";
import type { Category, Marker } from "./catalog/schema.js";
import { type FollowUpText, markerText, type TextLocale } from "./catalog/text.js";
import { alertHeadlineStart } from "./findings.js";
import type { FollowUpKind } from "./types.js";

const catalog = new Map([...markers, ...derived, ...studyMarkers].map((entry) => [entry.key, entry]));

const hindiCategoryLabels: Record<Category, string> = {
  metabolic: "ब्लड शुगर",
  lipids: "कोलेस्ट्रॉल और लिपिड",
  cardiac: "दिल",
  inflammation: "सूजन",
  liver: "लिवर",
  kidney: "किडनी",
  thyroid: "थायरॉइड",
  vitamins: "विटामिन",
  iron: "आयरन",
  blood_count: "ब्लड काउंट",
  electrolytes: "इलेक्ट्रोलाइट",
  bone: "हड्डी और खनिज",
  urate: "यूरिक एसिड",
  hormones: "हॉर्मोन",
  urine: "पेशाब",
  vitals: "वाइटल्स",
  studies: "स्कैन और ECG",
  other: "अन्य",
};

/** Returns the display label of a marker category in a locale. */
export function categoryLabel(key: Category, locale: TextLocale): string {
  if (locale === "hi") return hindiCategoryLabels[key];
  return categories.find((category) => category.key === key)?.label ?? key;
}

const hindiVerdicts: [RegExp, (...parts: string[]) => string][] = [
  [
    /^We could not check any marker on this report against a calibrated range\.$/,
    () => "हम इस रिपोर्ट का कोई मार्कर कैलिब्रेटेड रेंज से नहीं जाँच सके।",
  ],
  [
    /^All (\d+) markers sit in your calibrated ranges\. Nothing needs to move first\.$/,
    (count) =>
      `सभी ${count} मार्कर आपकी कैलिब्रेटेड रेंज में हैं। किसी मार्कर पर पहले काम करने की ज़रूरत नहीं है।`,
  ],
  [
    /^(\d+) of (\d+) markers sit in your calibrated ranges\. (.+) is the one to move first\.$/,
    (optimal, scored, name) =>
      `${scored} में से ${optimal} मार्कर आपकी कैलिब्रेटेड रेंज में हैं। सबसे पहले ${name} पर काम करें।`,
  ],
];

/**
 * Returns a stored verdict in a locale, or the stored text when no template matches.
 *
 * @remarks
 * The verdict is stored as English text at read time, so the Hindi form is rebuilt from the same counts and name.
 * Rebuilding from the stored text keeps both languages on the numbers the engine wrote.
 */
export function localizeVerdict(verdict: string, locale: TextLocale): string {
  if (locale !== "hi") return verdict;
  for (const [pattern, write] of hindiVerdicts) {
    const match = pattern.exec(verdict);
    if (match) return write(...match.slice(1));
  }
  return verdict;
}

const hindiFollowUps: Record<FollowUpKind, (marker: Marker) => FollowUpText> = {
  supplement: (marker) => {
    const text = markerText(marker, "hi");
    return {
      title: `कम ${marker.name} के लिए सप्लीमेंट के बारे में डॉक्टर से पूछें`,
      why: `आपका ${marker.name} आपकी कैलिब्रेटेड रेंज से कम है। ${text.whyItMatters}`,
      next: `डॉक्टर से पूछें कि क्या सप्लीमेंट आपके लिए ठीक है और कितनी खुराक लेनी है। 8 से 12 हफ़्ते में दोबारा टेस्ट करें। ${text.whatMovesIt}`,
    };
  },
  retest: (marker) => {
    const text = markerText(marker, "hi");
    return {
      title: `8 से 12 हफ़्ते में ${marker.name} का दोबारा टेस्ट करें`,
      why: `आपका ${marker.name} आपकी कैलिब्रेटेड रेंज से काफ़ी बाहर है। ${text.whyItMatters}`,
      next: `${text.whatMovesIt} 8 से 12 हफ़्ते में दोबारा टेस्ट बुक करें। दोनों रिपोर्ट अपने डॉक्टर को दिखाएँ।`,
    };
  },
  measure: (marker) => {
    const text = markerText(marker, "hi");
    return {
      title: `${marker.name} का टेस्ट कराएँ`,
      why: `${marker.name} इस रिपोर्ट में नहीं है। ${text.whyItMatters}`,
      next: `अपने अगले ब्लड टेस्ट में ${marker.name} का टेस्ट माँगें। ${text.whatItIs}`,
    };
  },
};

/**
 * Returns a stored follow-up in a locale, or the stored copy when the marker or the locale has no text.
 *
 * @remarks
 * A follow-up whose title is one of the marker's text rule titles came from that rule, so it takes the rule's Hindi copy.
 * Every other follow-up came from the template of its kind.
 */
export function localizeFollowUp<T extends FollowUpText & { kind: FollowUpKind; markerKey: string | null }>(
  followUp: T,
  locale: TextLocale,
): T {
  const marker = followUp.markerKey ? catalog.get(followUp.markerKey) : undefined;
  if (locale !== "hi" || !marker) return followUp;
  const rules = markerText(marker, "en").textRuleFollowUps ?? [];
  const rule = rules.findIndex(({ title }) => title === followUp.title);
  const hindi =
    rule >= 0 ? markerText(marker, "hi").textRuleFollowUps?.[rule] : hindiFollowUps[followUp.kind](marker);
  return hindi ? { ...followUp, ...hindi } : followUp;
}

const hindiStudyKinds: Record<string, string> = {
  "X-ray": "X-ray",
  ultrasound: "अल्ट्रासाउंड",
  "CT scan": "CT स्कैन",
  "MRI scan": "MRI स्कैन",
  ECG: "ECG",
  pathology: "पैथोलॉजी",
  test: "टेस्ट",
};

/**
 * Returns the engine's alert headline sentence in a locale, or the sentence as it is when it is not that headline.
 */
export function localizeAlertHeadline(sentence: string, locale: TextLocale): string {
  if (locale !== "hi" || !sentence.startsWith(alertHeadlineStart)) return sentence;
  const names = sentence
    .slice(alertHeadlineStart.length)
    .replace(/ reports?\.$/, "")
    .split(" and ")
    .map((name) => hindiStudyKinds[name] ?? name);
  return `अपनी ${names.join(" और ")} रिपोर्ट की एक लाइन के बारे में डॉक्टर से पूछें।`;
}
