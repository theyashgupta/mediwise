import { plural } from "../plural";
import { formatCount } from "../locales";

export const episodes = {
  title: "Episodes",
  sectionTitle: (name: string) => `Episodes of ${name}`,
  sectionDescription:
    "An episode groups the reports of one set of tests, for example many tests in a few weeks.",
  empty: "No episodes yet. MediWise suggests one when three reports arrive within 45 days.",
  loadError: "We could not load the episodes.",
  reports: (n: number) =>
    plural("en", n, {
      one: `${formatCount("en", n)} report`,
      other: `${formatCount("en", n)} reports`,
    }),
  period: (from: string, to: string) => `${from} to ${to}`,
  openSince: (from: string) => `Open since ${from}`,
  open: "Open",
  ended: "Ended",
  openEpisode: "Open the episode",
  proposal: {
    title: "These reports may belong together",
    body: (count: number, from: string, to: string) =>
      `${formatCount("en", count)} reports arrived from ${from} to ${to}. Give them a name to see them as one episode.`,
    save: "Save as an episode",
    saving: "Saving",
    dismiss: "Close",
    failed: "We could not save the episode. Try again.",
  },
  fields: {
    name: "Name",
    namePlaceholder: "For example, thyroid tests",
    note: "Reason (optional)",
    noteHelp: "Only you see this note. MediWise does not use it to write the summary.",
    characters: (count: string, max: string) => `${count} of ${max} characters`,
  },
  page: {
    loadError: "We could not load this episode.",
    notFoundTitle: "We could not find this episode",
    notFoundBody: "Someone deleted it, or it belongs to another account.",
    back: "Back to episodes",
    summary: "Summary",
    stats: { reports: "Reports", days: "Days", repeated: "Repeated" },
    timeline: {
      title: "Timeline",
      description: "Every report of the episode, oldest first.",
      empty: "This episode has no reports. Add a report from its report page.",
      markers: (n: number, flagged: number) =>
        `${plural("en", n, { one: `${formatCount("en", n)} marker`, other: `${formatCount("en", n)} markers` })}, ${formatCount("en", flagged)} with watch or risk status`,
      unnamedReport: "Report",
    },
    repeated: {
      title: "Repeated markers",
      description: "Markers with two values or more in this episode.",
      empty: "No marker has two values in this episode.",
      values: (n: number) => `${formatCount("en", n)} values`,
    },
    since: {
      title: "Since the episode started",
      description: "The first value and the last value of each repeated marker.",
      to: "to",
    },
    studies: {
      title: "Studies",
      description: "MediWise copies the impression from the printed report.",
      noImpression: "The report prints no impression.",
    },
    outstanding: {
      title: "Measured once",
      description:
        "These results have watch or risk status and one value in this episode. Talk to your doctor about them.",
      empty: "No result has watch or risk status with one value only.",
    },
    direction: { improving: "Improving", worsening: "Worsening", stable: "Stable" },
  },
  settings: {
    title: "Episode settings",
    save: "Save",
    saved: "We saved the episode.",
    end: "End the episode",
    reopen: "Open the episode again",
    delete: "Delete the episode",
    failed: "We could not save the change. Try again.",
    deleteDialog: {
      title: "Delete this episode?",
      description: "The reports stay. Only the episode and its note go.",
      cancel: "Cancel",
      confirm: "Delete",
      deleting: "Deleting",
    },
    deleted: (name: string) => `We deleted ${name}.`,
  },
  report: {
    title: "Episode",
    description:
      "Add this report to an episode to see it with the other reports of the same tests.",
    partOf: "This report is part of",
    remove: "Remove from the episode",
    episode: "Episode",
    newEpisode: "New episode",
    add: "Add to the episode",
    adding: "Adding",
    failed: "We could not change the episode. Try again.",
  },
};
