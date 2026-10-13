import { EpisodeCard } from "../components/episode-card";
import { useEpisodes } from "../hooks/use-episodes";
import { EpisodeProposalContainer } from "./episode-proposal-container";

type EpisodeCardContainerProps = {
  profileId: string | undefined;
};

export function EpisodeCardContainer({ profileId }: EpisodeCardContainerProps) {
  const episodes = useEpisodes(profileId);
  const data = episodes.data;
  if (!profileId || !data) return null;
  return (
    <>
      {data.proposal && <EpisodeProposalContainer profileId={profileId} proposal={data.proposal} />}
      {data.episodes
        .filter((episode) => !episode.endedOn)
        .map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
    </>
  );
}
