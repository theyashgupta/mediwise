import type { ReportStatus } from "@mediwise/shared";

export const statusGroupOrder: ReportStatus[] = [
  "processing",
  "queued",
  "paused",
  "done",
  "failed",
];

export const inProgress = (status: ReportStatus) =>
  status === "queued" || status === "processing" || status === "paused";
