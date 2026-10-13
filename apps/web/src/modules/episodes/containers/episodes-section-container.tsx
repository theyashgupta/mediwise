import { Section } from "@/common/components/section";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { EpisodeList } from "../components/episode-list";
import { useEpisodes } from "../hooks/use-episodes";
import { EpisodeProposalContainer } from "./episode-proposal-container";

type EpisodesSectionContainerProps = {
  profileId: string;
  profileName: string;
};

export function EpisodesSectionContainer({
  profileId,
  profileName,
}: EpisodesSectionContainerProps) {
  const t = useT().episodes;
  const episodes = useEpisodes(profileId);
  const data = episodes.data;
  return (
    <Section id="episodes" title={t.sectionTitle(profileName)} description={t.sectionDescription}>
      {episodes.isPending && <LoadingState variant="list" />}
      {episodes.isError && <ErrorState message={t.loadError} onRetry={() => episodes.refetch()} />}
      {data?.proposal && (
        <EpisodeProposalContainer profileId={profileId} proposal={data.proposal} />
      )}
      {data && data.episodes.length > 0 && <EpisodeList episodes={data.episodes} />}
      {data && data.episodes.length === 0 && !data.proposal && (
        <p className="text-muted-foreground">{t.empty}</p>
      )}
    </Section>
  );
}
