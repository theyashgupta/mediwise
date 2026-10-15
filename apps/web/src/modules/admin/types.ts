import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type CreditFilter = { from?: string; to?: string; userId?: string };

export type CreditHistory = InferResponseType<typeof api.admin.credits.$get, 200>;
export type CreditGroup = CreditHistory["reportCredits"];

export type FailedReport = InferResponseType<
  (typeof api.admin)["failed-reports"]["$get"],
  200
>[number];
