export const features = {
  eyebrow: "Features",
  title: "Built for reports from any lab",
  files: {
    title: (maxFiles: number) => `Up to ${maxFiles} files per report`,
    body: (fileMb: number, totalMb: number) =>
      `PDF, photo or portal screenshot, ${fileMb} MB each and ${totalMb} MB in total.`,
  },
  studies: {
    title: "ECG, ultrasound and X-ray reports",
    body: "MediWise copies the printed words and values, not the scan images.",
  },
  family: {
    title: "Profiles for your family",
    body: (maxProfiles: number) =>
      `Up to ${maxProfiles} profiles, each with ranges for their own age, sex and ancestry.`,
    language: "Choose Hindi in Settings to read the app and your summary in Hindi.",
  },
  doctor: {
    title: "A summary for your doctor",
    body: "Print your results on one clean page, black on white, for your visit.",
  },
  questions: {
    title: "Questions for your doctor",
    body: "MediWise writes questions from your results to take to your next visit.",
  },
  settled: {
    title: "Repeat scans can settle a line",
    body: (days: number) =>
      `The same study within ${days} days, with no alert line, settles the earlier line.`,
  },
  episode: {
    title: "One episode for one workup",
    body: "MediWise finds reports that may belong together and shows them in date order.",
  },
  trends: {
    title: "Trends across visits",
    body: "See each marker across visits, with your optimal range as a band.",
  },
};
