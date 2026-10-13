import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Dashboard = InferResponseType<typeof api.dashboard.$get, 200>;
export type LatestReport = NonNullable<Dashboard["latest"]>;
export type MoveFirstMarker = Dashboard["moveFirst"][number];
export type RecentReport = Dashboard["recent"][number];
