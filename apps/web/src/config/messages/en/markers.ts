export const markers = {
  noChange: "No change",
  side: { above: "above", below: "below", outside: "outside" },
  rangeName: { watch: "watch", lab: "lab" },
  sentence: {
    optimal: (name: string) => `Your ${name} is in the optimal range for your profile.`,
    watch: (name: string, side: string) =>
      `Your ${name} is ${side} the optimal range, but in the watch range.`,
    risk: (name: string, side: string, range: string) =>
      `Your ${name} is ${side} the ${range} range. Speak with a doctor about this value.`,
    unknown: "MediWise did not score this value. No calibrated range applies to your profile.",
  },
  header: {
    labRange: (range: string) => `Lab range: ${range}`,
    noLabRange: "The report shows no lab range.",
  },
  knowledge: {
    whatItIs: "What it is",
    whyItMatters: "Why it matters",
    whatMovesIt: "What moves it",
  },
  nav: {
    label: "Other markers in this report",
    previous: "Previous marker",
    next: "Next marker",
  },
  trajectory: {
    first: "This is the first value. The next report shows the direction of change.",
    since: (date: string) => `since the report of ${date}.`,
    band: "Optimal range for this report",
  },
  sit: {
    optimal: (range: string) => `Optimal ${range}.`,
    watch: (range: string) => `Watch ${range}.`,
    labBar: "Lab range (thin bar)",
    source: "Calibrated range source:",
    noCalibrated: "No calibrated range applies to your profile. MediWise uses the lab range.",
    noRange: "No range applies to your profile.",
  },
  page: {
    loadError: "We could not load this marker.",
    missingTitle: "This marker is not in this report",
    missingBody: "Open the report to see the markers that it has.",
    openReport: "Open the report",
    whereYouSit: "Where you sit",
    trajectory: "Trajectory",
    meaning: "What this means for you",
    knowledge: "The knowledge",
    calibratedFor: (who: string) => `Calibrated for you, ${who}`,
    sources: "Sources",
  },
};
