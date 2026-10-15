import { plural } from "../plural";
import { formatCount } from "../locales";

export const yearReview = {
  title: "Year in review",
  period: (from: string, to: string) => `${from} to ${to}`,
  card: {
    score: (from: number, to: number) => `Score ${from} → ${to}`,
    moved: (n: number) =>
      plural("en", n, {
        one: `${formatCount("en", n)} marker moved`,
        other: `${formatCount("en", n)} markers moved`,
      }),
    stillAtRisk: (n: number) => `${formatCount("en", n)} still at risk`,
    open: "Open the review",
  },
  direction: { improved: "Better status", worsened: "Worse status" },
  to: "to",
  noScore: "No score",
  stats: { score: "Score", reports: "Reports", labs: "Labs" },
  moved: {
    title: "Markers that moved",
    description:
      "These markers have a different status in the last report than in the first report.",
    empty: "No marker moved to a different status.",
  },
  risk: {
    title: "Markers still at risk",
    description: "These markers have risk status in the first report and in the last report.",
    empty: "No marker kept risk status.",
  },
  once: {
    title: "Markers measured once",
    description: "These markers have one value in this period, so they have no trend.",
  },
  page: {
    print: "Print",
    loadError: "We could not load the year in review.",
    emptyTitle: "No year in review yet",
    emptyBody:
      "A year in review needs two reports from one year. Upload a second report to see what changed.",
    upload: "Upload a report",
    writeIntro: "Write the intro",
    introError: "We could not write the intro. Try again.",
  },
};
