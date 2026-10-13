import { createFileRoute } from "@tanstack/react-router";
import { EpisodeContainer } from "@/modules/episodes";

export const Route = createFileRoute("/_app/episodes/$episodeId")({ component: EpisodeContainer });
