import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type Profile = InferResponseType<typeof api.profiles.$get, 200>[number];
