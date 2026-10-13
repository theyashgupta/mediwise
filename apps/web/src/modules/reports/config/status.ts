import type { ReportStatus } from "@mediwise/shared";

export const reportStatusLabels: Record<ReportStatus, string> = {
  draft: "Uploading",
  queued: "Queued",
  processing: "Reading",
  paused: "Paused",
  done: "Ready",
  failed: "Could not read",
};

export const statusGroupOrder: ReportStatus[] = [
  "processing",
  "queued",
  "paused",
  "done",
  "failed",
];

export const inProgress = (status: ReportStatus) =>
  status === "queued" || status === "processing" || status === "paused";
