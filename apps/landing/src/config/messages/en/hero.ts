export const hero = {
  eyebrow: "For lab reports in India",
  title: "Your lab report, explained marker by marker.",
  body: "Upload a report as a PDF or photos. MediWise explains every marker and scores it for your age, sex and ancestry. Then it tracks each marker across visits.",
  howItWorks: "See how it works",
  forOneReport: "for one report.",
  perReportInPack: (credits: number) => `a report in the pack of ${credits}.`,
  gst: "Prices include GST.",
  reportAlt:
    "A MediWise report: 67 of 81 markers sit in the calibrated ranges, and urine albumin is the one to move first. Score 89, Platinum.",
  callouts: {
    files: (count: number) => `${count} files`,
    filesLabel: "PDFs or photos in one report",
    markers: (count: number) => `${count} markers`,
    markersLabel: "Explained, each with a cited source",
    storage: "Mumbai",
    storageLabel: "Where we store your reports",
  },
};
