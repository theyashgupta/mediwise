import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Badge } from "@/components/ui/badge";
import { formatEpisodeDate } from "../config/episodes";
import type { EpisodeItem } from "../types";

type EpisodeListProps = {
  episodes: EpisodeItem[];
};

export function EpisodeList({ episodes }: EpisodeListProps) {
  const t = useT().episodes;
  return (
    <ul className="divide-y rounded-xl border bg-card" data-testid="episode-list">
      {episodes.map((episode) => (
        <li
          key={episode.id}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
        >
          <div className="min-w-0 space-y-0.5">
            <Link
              to="/episodes/$episodeId"
              params={{ episodeId: episode.id }}
              className="font-medium underline-offset-4 hover:underline"
            >
              {episode.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {episode.endedOn
                ? t.period(formatEpisodeDate(episode.startedOn), formatEpisodeDate(episode.endedOn))
                : t.openSince(formatEpisodeDate(episode.startedOn))}{" "}
              · {t.reports(episode.reportIds.length)}
            </p>
          </div>
          <Badge variant={episode.endedOn ? "secondary" : "outline"}>
            {episode.endedOn ? t.ended : t.open}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
