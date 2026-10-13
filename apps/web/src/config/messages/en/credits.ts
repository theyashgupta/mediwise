import { plural } from "../plural";

export const credits = {
  left: (n: number) => plural("en", n, { one: `${n} report left`, other: `${n} reports left` }),
  title: "Report credits",
  description: "How MediWise counts the reports it reads.",
  loadError: "We could not load your credits.",
  none: "You have no report credits left.",
  eachReport: "Each report that MediWise reads uses one report credit.",
  refund: "When we cannot read a report, we return its credit to you.",
  cannotBuy: "You cannot buy credits yet. Payments come in a later release.",
  contact: "To get credits now, contact the MediWise team.",
  goToReports: "Go to your reports",
};
