import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type ReportSummary = InferResponseType<typeof api.reports.$get, 200>["items"][number];

export type ReportDetail = InferResponseType<(typeof api.reports)[":id"]["$get"], 200>;

export type MarkerRow = ReportDetail["categories"][number]["markers"][number];

export type FollowUp = ReportDetail["followUps"][number];

export type Study = ReportDetail["studies"][number];

export type MarkerFilter = "all" | "attention";

export type Finding = ReportDetail["findings"][number];
