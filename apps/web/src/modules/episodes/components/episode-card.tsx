import { Link } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { formatEpisodeDate } from "../config/episodes";
import type { EpisodeItem } from "../types";

type EpisodeCardProps = {
  episode: EpisodeItem;
};

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const t = useT().episodes;
  const headingId = `episode-card-${episode.id}`;
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 gap-3">
        <Layers className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {episode.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.openSince(formatEpisodeDate(episode.startedOn))} ·{" "}
            {t.reports(episode.reportIds.length)}
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="self-start sm:self-center">
        <Link to="/episodes/$episodeId" params={{ episodeId: episode.id }}>
          {t.openEpisode}
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
