import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Trends = InferResponseType<typeof api.trends.$get, 200>;

export type TrendItem = Trends["markers"][number];

export type TrendDetail = InferResponseType<(typeof api.trends)[":markerKey"]["$get"], 200>;

export type Comparison = InferResponseType<typeof api.compare.$get, 200>;

export type CompareRow = Comparison["groups"][number]["rows"][number];

export type ReportHeader = Comparison["reports"][number];

export type Change = TrendItem["change"];

export type Direction = TrendItem["direction"];

export type TrendSort = "change" | "name";

export type TrendStatus = "risk" | "watch" | "optimal";

export type TrendSearch = {
  category?: string;
  direction?: Direction;
  status?: TrendStatus;
  sort?: "name";
};

export type WatchItem = Trends["attention"][number];
