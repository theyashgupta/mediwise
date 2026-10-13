import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type YearReview = InferResponseType<
  (typeof api.profiles)[":id"]["year-review"]["$get"],
  200
>;

export type Reading = YearReview["moved"][number]["from"];
