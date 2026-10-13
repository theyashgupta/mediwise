export const comparison = {
  eyebrow: "Compare",
  title: "A lab PDF gives you numbers. MediWise tells you what they mean.",
  caption: "A standard lab PDF compared with MediWise",
  feature: "Feature",
  pdf: "A standard lab PDF",
  rows: {
    explained: {
      label: "Explained",
      pdf: "Test names and numbers",
      us: "Every marker in plain English or Hindi",
    },
    scored: {
      label: "Scored",
      pdf: "The lab's printed range",
      us: "Ranges for your age, sex and ancestry",
    },
    tracked: {
      label: "Tracked",
      pdf: "One visit in each file",
      us: "Each marker across your visits",
    },
    family: {
      label: "Family",
      pdf: "A file for each person",
      us: (maxProfiles: number) => `Up to ${maxProfiles} profiles in one account`,
    },
    flags: {
      label: "Flags for your doctor",
      pdf: "Easy to miss in a long report",
      us: "Scan lines and questions to take to your doctor",
    },
    cost: {
      label: "Cost",
      pdf: "Comes with the test",
      us: (perReport: string) => `From ${perReport} a report`,
    },
  },
};
