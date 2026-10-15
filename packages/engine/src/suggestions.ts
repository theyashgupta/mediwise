import {
  type AttentionAlert,
  type AttentionMarker,
  type AttentionVisit,
  buildAttention,
} from "./attention.js";
import {
  derived,
  type Lifestyle,
  lifestyle,
  lifestyleText,
  markers,
  type Marker,
  type Source,
  sources,
  type TextLocale,
  urgentLimits,
} from "./catalog/index.js";
import { alertHeadlineStart, studyKindNames } from "./findings.js";
import { localizeAlertHeadline } from "./localize.js";
import { retestDueDate } from "./retest.js";
import { doctorLine } from "./suggestion.js";
import type { Suggestion } from "./types.js";

const catalog = new Map([...markers, ...derived].map((entry) => [entry.key, entry]));
const sourceById = new Map<string, Source>(
  Object.values(sources).map((source) => [source.id, source]),
);
const studyNames = new Set([...Object.values(studyKindNames), "test"]);
const storedAlertTitle = /^Your (.+?) report says:/;

type Copy = Pick<Suggestion, "title" | "why" | "next">;
type Side = "high" | "low";
type Flagged = { item: AttentionMarker; name: string };
type Draft = Omit<Suggestion, "rank" | "disclaimer">;

/** Names up to two markers, then counts the rest, so a title stays short however many markers share it. */
function shortList(names: string[], and: string, more: string) {
  if (names.length > 2) return `${names[0]}, ${names[1]} ${and} ${names.length - 2} ${more}`;
  return names.join(` ${and} `);
}

const copy = {
  en: {
    disclaimer: `MediWise is for information. ${doctorLine.en}`,
    urgent: (name: string): Copy => ({
      title: `See a doctor today about your ${name}`,
      why: `Your latest ${name} is far outside the usual range.`,
      next: "See a doctor today and take this report with you. If you feel unwell, go to an emergency department now.",
    }),
    alert: (headline: string): Copy => ({
      title: headline,
      why: "A line in this report needs a doctor to read it.",
      next: "Book a visit with your doctor. Do not wait for your next test. Take this report with you.",
    }),
    soon: (names: string[]): Copy => ({
      title:
        names.length === 1
          ? `Show your ${names[0]} result to your doctor`
          : `Show ${names.length} results to your doctor`,
      why:
        names.length === 1
          ? `Your latest ${names[0]} is well outside your calibrated range.`
          : `These ${names.length} results are well outside your calibrated range.`,
      next: "Book a visit with your doctor in the next few weeks. Take your reports with you. Ask when to test again.",
    }),
    supplement: (name: string): Copy => ({
      title: `Ask your doctor about a supplement for low ${name}`,
      why: `Your latest ${name} is below your calibrated range.`,
      next: "Ask your doctor if a supplement is right for you. Do not start one on your own.",
    }),
    retest: (name: string, risk: boolean, weeks: number): Copy => ({
      title: `Retest your ${name}`,
      why: `Your latest ${name} is ${risk ? "well " : ""}outside your calibrated range.`,
      next: `Book a retest of ${name} about ${weeks} weeks after your last test. Take both reports to your doctor.`,
    }),
    habit: (names: string[], side: Side, habits: string[]): Copy => ({
      title: `Habits that can help your ${shortList(names, "and", "more")}`,
      why:
        names.length === 1
          ? `Your latest ${names[0]} is ${side === "high" ? "above" : "below"} your calibrated range.`
          : `These ${names.length} results are ${side === "high" ? "above" : "below"} your calibrated range.`,
      next: habits.join(" "),
    }),
  },
  hi: {
    disclaimer: `MediWise सिर्फ़ जानकारी के लिए है। ${doctorLine.hi}`,
    urgent: (name: string): Copy => ({
      title: `अपने ${name} के बारे में आज ही डॉक्टर से मिलें`,
      why: `आपका सबसे नया ${name} सामान्य रेंज से बहुत बाहर है।`,
      next: "आज ही डॉक्टर से मिलें और यह रिपोर्ट साथ ले जाएँ। अगर आपकी तबीयत ठीक नहीं है, तो अभी इमरजेंसी विभाग जाएँ।",
    }),
    alert: (headline: string): Copy => ({
      title: localizeAlertHeadline(headline, "hi"),
      why: "इस रिपोर्ट की एक लाइन डॉक्टर को पढ़नी चाहिए।",
      next: "अपने डॉक्टर से मिलने का समय लें। अपने अगले टेस्ट का इंतज़ार न करें। यह रिपोर्ट साथ ले जाएँ।",
    }),
    soon: (names: string[]): Copy => ({
      title:
        names.length === 1
          ? `अपना ${names[0]} नतीजा डॉक्टर को दिखाएँ`
          : `${names.length} नतीजे डॉक्टर को दिखाएँ`,
      why:
        names.length === 1
          ? `आपका सबसे नया ${names[0]} आपकी कैलिब्रेटेड रेंज से काफ़ी बाहर है।`
          : `ये ${names.length} नतीजे आपकी कैलिब्रेटेड रेंज से काफ़ी बाहर हैं।`,
      next: "अगले कुछ हफ़्तों में अपने डॉक्टर से मिलें। अपनी रिपोर्ट साथ ले जाएँ। पूछें कि दोबारा टेस्ट कब कराना है।",
    }),
    supplement: (name: string): Copy => ({
      title: `कम ${name} के लिए सप्लीमेंट के बारे में डॉक्टर से पूछें`,
      why: `आपका सबसे नया ${name} आपकी कैलिब्रेटेड रेंज से कम है।`,
      next: "डॉक्टर से पूछें कि क्या सप्लीमेंट आपके लिए ठीक है। अपने आप सप्लीमेंट शुरू न करें।",
    }),
    retest: (name: string, risk: boolean, weeks: number): Copy => ({
      title: `अपना ${name} दोबारा टेस्ट कराएँ`,
      why: `आपका सबसे नया ${name} आपकी कैलिब्रेटेड रेंज से ${risk ? "काफ़ी " : ""}बाहर है।`,
      next: `पिछले टेस्ट के लगभग ${weeks} हफ़्ते बाद ${name} का दोबारा टेस्ट बुक करें। दोनों रिपोर्ट अपने डॉक्टर को दिखाएँ।`,
    }),
    habit: (names: string[], side: Side, habits: string[]): Copy => ({
      title: `आदतें जो आपके ${shortList(names, "और", "अन्य")} में मदद कर सकती हैं`,
      why:
        names.length === 1
          ? `आपका सबसे नया ${names[0]} आपकी कैलिब्रेटेड रेंज से ${side === "high" ? "ज़्यादा" : "कम"} है।`
          : `ये ${names.length} नतीजे आपकी कैलिब्रेटेड रेंज से ${side === "high" ? "ज़्यादा" : "कम"} हैं।`,
      next: habits.join(" "),
    }),
  },
} satisfies Record<TextLocale, unknown>;

function sourcesOf(...ids: (string | undefined)[]): Source[] {
  return ids.flatMap((id) => (id && sourceById.has(id) ? [sourceById.get(id)!] : []));
}

/**
 * Rebuilds the engine headline of a stored alert from its study kind alone.
 *
 * @remarks
 * A stored alert title quotes the printed report line, which can name a diagnosis, so that line never reaches a suggestion.
 */
function alertHeadlineOf(storedTitle: string) {
  const name = storedAlertTitle.exec(storedTitle)?.[1];
  return `${alertHeadlineStart}${name && studyNames.has(name) ? name : "test"} report.`;
}

/**
 * Tells whether a marker's latest value is past its urgent limit, and returns the limit's source when it is.
 *
 * @remarks
 * Only a risk value in the catalog unit counts, so a value the lab printed in a unit the engine could not convert never
 * raises a doctor-now suggestion.
 */
function urgentSource(item: AttentionMarker, entry: Marker): string | undefined {
  const limit = urgentLimits[item.markerKey];
  if (!limit || item.status !== "risk" || item.unit !== entry.unit) return undefined;
  if (limit.below && item.value < limit.below.value) return limit.below.source;
  if (limit.above && item.value > limit.above.value) return limit.above.source;
  return undefined;
}

function bySeverity({ item: a }: Flagged, { item: b }: Flagged) {
  if (a.status !== b.status) return a.status === "risk" ? -1 : 1;
  return Math.abs(b.deviation) - Math.abs(a.deviation);
}

/**
 * Builds the suggestions for one profile from its whole history: doctor-now, doctor-soon, supplement-ask, retest, habit.
 *
 * @remarks
 * A marker past its urgent limit gets only doctor-now, and its habit block gets no habit suggestion, so a habit line never
 * sits next to a value that needs a doctor today. `visits` must be oldest first.
 */
export function buildSuggestions(
  visits: AttentionVisit[],
  alerts: AttentionAlert[] = [],
  locale: TextLocale = "en",
): Suggestion[] {
  const text = copy[locale];
  const doctorNow: Draft[] = [];
  const retests: Draft[] = [];
  const soon: Flagged[] = [];
  const supplements: Flagged[] = [];
  const habits: Flagged[] = [];
  const urgentBlocks = new Set<Lifestyle | undefined>();
  const alerted = new Set<string>();

  for (const item of buildAttention(visits, alerts)) {
    if (item.kind === "alert") {
      const { reportId, date, title } = item;
      const headline = alertHeadlineOf(title);
      if (alerted.has(`${reportId} ${headline}`)) continue;
      alerted.add(`${reportId} ${headline}`);
      doctorNow.push({
        kind: "doctor_now",
        markerKeys: [],
        reportId,
        date,
        sources: [],
        ...text.alert(headline),
      });
      continue;
    }
    const entry = catalog.get(item.markerKey);
    if (!entry || item.status === "optimal") continue;
    const at = { markerKeys: [item.markerKey], reportId: item.reportId, date: item.date };
    const urgent = urgentSource(item, entry);
    if (urgent) {
      doctorNow.push({
        kind: "doctor_now",
        ...at,
        sources: sourcesOf(urgent),
        ...text.urgent(entry.name),
      });
      urgentBlocks.add(lifestyle[item.markerKey]);
      continue;
    }
    const flagged = { item, name: entry.name };
    if (item.status === "risk") soon.push(flagged);
    if (entry.supplementable && item.deviation < 0) supplements.push(flagged);
    const retest = entry.retest?.find(({ status }) => status === item.status);
    const dueOn = retestDueDate(item.markerKey, item.status, item.date);
    if (retest && dueOn) {
      retests.push({
        kind: "retest",
        ...at,
        dueOn,
        sources: sourcesOf(retest.source),
        ...text.retest(entry.name, item.status === "risk", retest.weeks),
      });
    }
    const side = item.deviation > 0 ? "high" : item.deviation < 0 ? "low" : undefined;
    if (side && side === lifestyle[item.markerKey]?.side) habits.push(flagged);
  }

  const byBlock = new Map<Lifestyle, Flagged[]>();
  for (const flagged of habits.toSorted(bySeverity)) {
    const block = lifestyle[flagged.item.markerKey]!;
    if (!urgentBlocks.has(block)) byBlock.set(block, [...(byBlock.get(block) ?? []), flagged]);
  }
  const habitDrafts = [...byBlock].map(([block, group]): Draft => {
    const { item } = group[0]!;
    const lines = lifestyleText(item.markerKey, locale)!;
    return {
      kind: "habit",
      markerKeys: group.map((flagged) => flagged.item.markerKey),
      reportId: item.reportId,
      date: item.date,
      ...lines,
      sources: sourcesOf(block.source),
      ...text.habit(
        group.map(({ name }) => name),
        block.side,
        lines.habits,
      ),
    };
  });

  const soonSorted = soon.toSorted(bySeverity);
  const soonDrafts: Draft[] = soonSorted[0]
    ? [
        {
          kind: "doctor_soon",
          markerKeys: soonSorted.map(({ item }) => item.markerKey),
          reportId: soonSorted[0].item.reportId,
          date: soonSorted[0].item.date,
          sources: [],
          ...text.soon(soonSorted.map(({ name }) => name)),
        },
      ]
    : [];
  const supplementDrafts = supplements.toSorted(bySeverity).map(({ item, name }): Draft => ({
    kind: "supplement_ask",
    markerKeys: [item.markerKey],
    reportId: item.reportId,
    date: item.date,
    sources: [],
    ...text.supplement(name),
  }));

  return [
    ...doctorNow,
    ...soonDrafts,
    ...supplementDrafts,
    ...retests.toSorted((a, b) => (a.dueOn ?? "").localeCompare(b.dueOn ?? "")),
    ...habitDrafts,
  ].map((draft, index) => ({ ...draft, disclaimer: text.disclaimer, rank: index + 1 }));
}
