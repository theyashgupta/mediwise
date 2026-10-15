export const howItWorks = {
  eyebrow: "How it works",
  title: "From a lab PDF to a clear report",
  body: "You do not need to know what a marker means. MediWise reads the report and tells you.",
  upload: {
    title: "Upload",
    body: (maxFiles: number) =>
      `Add your report as a PDF or as photos. You can add up to ${maxFiles} files in one report.`,
    alt: (maxFiles: number) => `The upload page: drop up to ${maxFiles} PDFs or photos.`,
  },
  understand: {
    title: "Understand",
    body: "MediWise explains every marker in plain language, in English and Hindi today. It shows each value against the printed reference range and a range for your age, sex and ancestry.",
    alt: "The Vitamin B12 page: what the marker is, the value, and where it sits in the range.",
  },
  track: {
    title: "Track",
    body: "See how each marker changes from one visit to the next. Keep a profile for each person in your family.",
    alt: "The trends page: each marker with its change since the last report.",
  },
};
