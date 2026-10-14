import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Question = InferResponseType<
  (typeof api.profiles)[":id"]["questions"]["$get"],
  200
>[number];

export type Cite = Question["sentences"][number]["cites"][number];

export type FactTarget = { reportId: string; markerKey: string };

export type Me = InferResponseType<typeof api.me.$get, 200>;
