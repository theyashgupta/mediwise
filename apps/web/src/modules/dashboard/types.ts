import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Dashboard = InferResponseType<typeof api.dashboard.$get, 200>;
export type LatestReport = NonNullable<Dashboard["latest"]>;
export type MoveFirstMarker = Dashboard["moveFirst"][number];
export type RecentReport = Dashboard["recent"][number];
export type FamilyMember = InferResponseType<typeof api.dashboard.family.$get, 200>[number];
export type RetestDate = Dashboard["retests"][number];
