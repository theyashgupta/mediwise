import { plural } from "../plural";

export const dashboard = {
  greeting: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    named: (greeting: string, name: string) => `${greeting}, ${name}`,
  },
  upload: "Upload a report",
  incomplete: {
    title: (name: string) => `Complete ${name}’s profile`,
    body: "Add a date of birth and a sex. MediWise uses them to score each marker against the correct range.",
    action: "Complete profile",
  },
  approximateBirth: {
    title: (name: string) => `Check ${name}’s date of birth`,
    body: "We calculated it from the age on a report. Some ranges change with age, so enter the exact date.",
    action: "Enter the date",
  },
  loadError: "We could not load your dashboard.",
  readFailed: "We could not read your latest report.",
  empty: {
    title: "Upload your first report",
    body: "Upload a PDF or photos of a report. We read every marker and explain it in plain English. We score each marker against ranges for your age, sex and ancestry.",
  },
  processing: {
    titleOne: "Reading your report",
    titleMany: (n: number) => `Reading your ${n} reports`,
    bodyOne: "This page updates when the report is ready.",
    bodyMany: "This page updates when each report is ready.",
  },
  latest: {
    coverage: (percent: number) => `Measures ${percent}% of core markers`,
    fallbackTitle: "Your latest report",
    since: (date: string) => `since your report of ${date}`,
    noChange: "No change",
    byStatus: "Markers by status",
    open: "Open report",
  },
  newSince: {
    title: (date: string) => `New since ${date}`,
    body: (date: string) =>
      `These reports have few markers. Your score stays from the report of ${date}.`,
  },
  attention: {
    title: "Needs attention",
    seeAll: (n: number) => `See all ${n}`,
    none: "All scored markers are in their optimal range.",
  },
  recent: {
    title: "Recent reports",
    all: "All reports",
    fallbackTitle: "Report",
    files: (n: number) => `${n} files`,
  },
  retest: {
    title: "Due for retest",
    dueSince: (date: string) => `Due since ${date}`,
    dueOn: (date: string) => `Due on ${date}`,
    addLabel: (marker: string) => `Add the ${marker} retest to your calendar`,
    add: "Add to calendar",
    askDoctor: "Ask your doctor before you book a retest.",
  },
  calendar: {
    summary: (marker: string, name: string) => `Retest ${marker} for ${name}`,
    description: (date: string) =>
      `MediWise suggests this date from your report of ${date}. Ask your doctor before you book a retest.`,
  },
  family: {
    title: "Your family",
    empty: "Add family members to see their reports here.",
    add: "Add a family member",
    noReport: "No report yet.",
    atRisk: (n: number) =>
      plural("en", n, { one: `${n} marker at risk`, other: `${n} markers at risk` }),
    stale: "No report in the last 12 months.",
    staleFrequent: "No report in the last 3 months.",
    upload: "Upload a report",
  },
};
