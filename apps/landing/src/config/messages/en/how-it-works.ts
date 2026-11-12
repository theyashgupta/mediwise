export const howItWorks = {
  eyebrow: "How it works",
  title: "From a lab PDF to a clear report",
  body: "You do not need to know what a marker means. MediWise reads the report and tells you.",
  step: (number: number) => `Step ${number}`,
  upload: {
    title: "Upload",
    body: (maxFiles: number) =>
      `Add your report as a PDF or as photos, up to ${maxFiles} files.`,
    alt: (maxFiles: number) => `The upload page: drop up to ${maxFiles} PDFs or photos.`,
  },
  understand: {
    title: "Understand",
    body: "MediWise explains each marker in plain language and shows where your value sits in the range.",
    alt: "The Vitamin B12 page: what the marker is, the value, and where it sits in the range.",
  },
  track: {
    title: "Track",
    body: "See how each marker changes from one visit to the next.",
    alt: "The trends page: each marker with its change since the last report.",
  },
};
