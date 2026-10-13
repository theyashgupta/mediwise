import type { InferResponseType } from "hono/client";
import type { api } from "@/lib/api";

export type EpisodeList = InferResponseType<(typeof api.profiles)[":id"]["episodes"]["$get"], 200>;
export type EpisodeItem = EpisodeList["episodes"][number];
export type Proposal = NonNullable<EpisodeList["proposal"]>;
export type EpisodeDetail = InferResponseType<(typeof api.episodes)[":id"]["$get"], 200>;
export type RepeatedMarker = EpisodeDetail["repeated"][number];
