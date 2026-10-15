import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type ReportSummary = InferResponseType<typeof api.reports.$get, 200>["items"][number];

export type ReportDetail = InferResponseType<(typeof api.reports)[":id"]["$get"], 200>;

export type MarkerRow = ReportDetail["categories"][number]["markers"][number];

export type FollowUp = ReportDetail["followUps"][number];

export type Study = ReportDetail["studies"][number];

export type MarkerFilter = "all" | "risk" | "watch" | "optimal";

export type Finding = ReportDetail["findings"][number];

export type SettledFinding = ReportDetail["settled"][number];

export type FindingSequence = Pick<SettledFinding, "state" | "earlier" | "later">;

export type ReportLink = ReportDetail["links"][number];

export type LinkKind = ReportLink["kind"];

export type ShareLink = InferResponseType<
  (typeof api.reports)[":id"]["share"]["$get"],
  200
>[number];

export type SharedReport = InferResponseType<(typeof api.share)[":token"]["$get"], 200>;

export type EarlierValue = SharedReport["earlier"][number];

export type ExportReport = Omit<SharedReport["report"], "studies"> & {
  studies: Omit<Study, "fileName" | "filmName">[];
};

export type ExportDetail = [term: string, detail: string | null | undefined];
