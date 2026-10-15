export const history = {
  eyebrow: "Across reports",
  title: "Every report in one history",
  body: "Scans, repeat tests and second opinions arrive weeks apart. MediWise keeps them together, in date order.",
  settled: {
    title: "A repeat scan can settle a line",
    body: (days: number) =>
      `MediWise links two reports when both have the same study within ${days} days. You can undo the link. When the later report has no alert line, the earlier line moves to Settled.`,
    alt: "The Settled block: a 34 mm cyst on 10 Feb 2025. The repeat ultrasound of 17 Mar 2025 shows no cyst.",
  },
  episode: {
    title: "One episode for one workup",
    body: "MediWise finds reports that may belong together. Give them a name, such as thyroid tests. The episode shows each report in date order and the markers that repeat.",
    alt: "An episode timeline: five reports from 3 Feb 2025 to 17 Mar 2025, oldest first.",
  },
  hindi: {
    title: "Your report in your language",
    body: "Choose Hindi in Settings or on the sign-in page. The app, the marker explanations and the report summary show in Hindi. Marker names and printed lines stay as the lab prints them.",
    alt: "The report summary in Hindi. Marker names such as Urine albumin and Homocysteine stay in English.",
  },
};
