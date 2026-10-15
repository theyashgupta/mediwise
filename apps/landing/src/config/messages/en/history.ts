export const history = {
  eyebrow: "Across reports",
  title: "Every report in one history",
  body: "Scans, repeat tests and second opinions arrive weeks apart. MediWise keeps them together, in date order.",
  settled: {
    title: "A repeat scan can settle a line",
    body: (days: number) =>
      `MediWise links two reports when both have the same study within ${days} days. You can undo the link. When the later report has no alert line, the earlier line moves to Settled.`,
  },
  episode: {
    title: "One episode for one workup",
    body: "MediWise finds reports that may belong together. Give them a name, such as thyroid tests. The episode shows each report in date order and the markers that repeat.",
  },
  hindi: {
    title: "Your report in your language",
    body: "Choose Hindi in Settings or on the sign-in page. The app, the marker explanations and the report summary show in Hindi. Marker names and printed lines stay as the lab prints them.",
  },
};
