import { plural } from "../plural";

export const dashboard = {
  ask: {
    title: "Ask about your reports",
    body: "Each answer names the report and the date of every number.",
    changed: (marker: string) => `How has my ${marker} changed?`,
    finding: (title: string) => `What does my report say about "${title}"?`,
    retest: (marker: string) => `When should I retest ${marker}?`,
    open: "Ask a question",
  },
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
  install: {
    title: "Install MediWise",
    body: "Add MediWise to your home screen. Then it opens like an app.",
    action: "Install",
    dismiss: "Close",
    ios: {
      title: "Add MediWise to your home screen",
      body: "Then MediWise opens like an app.",
      steps: ["Tap the Share button in Safari.", "Tap Add to Home Screen.", "Tap Add."],
      close: "Close",
    },
  },
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
    none: "All scored markers are in their optimal range.",
    filter: "Filter the list",
    filters: { all: "All", worsening: "Worsening", risk: "Risk", watch: "Watch" },
    noneInFilter: "No item in this group.",
    worsening: "Worsening",
    change: (delta: string, date: string) => `${delta} since ${date}`,
    study: "Study report",
    source: "From the latest value of each marker in all your reports.",
  },
  trendsLink: "Open trends",
  doctor: {
    title: "See a doctor",
    source: "From results well outside your calibrated range and from lines in your study reports.",
    now: "Today",
    soon: "Soon",
  },
  suggestion: {
    markers: "Markers behind this suggestion",
    openStudy: "Open the study report",
  },
  patterns: {
    title: "Patterns across reports",
    source: "We check groups of markers on the latest value of each marker in all your reports.",
    markers: "Markers in this pattern",
    change: {
      new: "New",
      worsening: "Worsening",
      improving: "Improving",
      stable: "No change",
      cleared: "Cleared",
    },
  },
  habits: {
    title: "Habits and questions for your doctor",
    source: "From markers outside your calibrated range in all your reports.",
    habits: "Habits",
    questions: "Questions for your doctor",
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
    source: "From the date of your last test and the usual retest time for each marker.",
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
