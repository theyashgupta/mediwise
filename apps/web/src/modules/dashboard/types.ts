import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Dashboard = InferResponseType<typeof api.dashboard.$get, 200>;
export type LatestReport = NonNullable<Dashboard["latest"]>;
export type NewSinceReport = Dashboard["newSince"][number];
export type AttentionItem = Dashboard["attention"][number];
export type RecentReport = Dashboard["recent"][number];
export type FamilyMember = InferResponseType<typeof api.dashboard.family.$get, 200>[number];
export type RetestDate = Dashboard["retests"][number];
export type Suggestion = Dashboard["suggestions"][number];
export type PatternTrend = Dashboard["patterns"][number];
export type RetestRow = RetestDate & { why?: string };
