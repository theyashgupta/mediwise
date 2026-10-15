export const bento = {
  eyebrow: "Features",
  title: "Built for reports from any lab",
  files: {
    title: (maxFiles: number) => `Up to ${maxFiles} files in one report`,
    body: (fileMb: number, totalMb: number) =>
      `PDF, photo or patient portal screenshot, in JPG, PNG, HEIC or WebP. Each file up to ${fileMb} MB, ${totalMb} MB in total.`,
  },
  family: {
    title: "Family profiles",
    body: (maxProfiles: number) =>
      `Up to ${maxProfiles} profiles. Each person gets ranges for their own age, sex and ancestry.`,
    people: ["Me", "Partner", "Parent", "Child"],
  },
  cost: {
    title: "Cost per report",
    body: (firstPrice: string, perReport: string, credits: number) =>
      `${firstPrice} for one report. ${perReport} a report in the pack of ${credits}.`,
  },
  trends: {
    title: "Trends",
    body: "See each marker across visits, with your optimal range as a band.",
  },
  doctor: {
    title: "A summary for your doctor",
    body: "Print your results on one clean page, black on white, to take to your visit.",
  },
  studies: {
    title: "ECG, ultrasound and X-ray reports",
    body: "MediWise copies the printed words and values from each study. It does not read the scan images.",
  },
};
