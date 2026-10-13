import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type MarkerDetail = InferResponseType<
  (typeof api.reports)[":id"]["markers"][":markerKey"]["$get"],
  200
>;

export type HistoryPoint = MarkerDetail["history"][number];

export type Bounds = { low: number | null; high: number | null };
