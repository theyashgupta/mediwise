import { ReportEpisode } from "../components/report-episode";
import { useEpisodeMutations, useEpisodes } from "../hooks/use-episodes";

type ReportEpisodeContainerProps = {
  reportId: string;
  profileId: string;
};

export function ReportEpisodeContainer({ reportId, profileId }: ReportEpisodeContainerProps) {
  const episodes = useEpisodes(profileId);
  const { create, setReport } = useEpisodeMutations();
  if (!episodes.data) return null;
  const current = episodes.data.episodes.find((episode) => episode.reportIds.includes(reportId));
  return (
    <ReportEpisode
      key={current?.id ?? "none"}
      current={current}
      episodes={episodes.data.episodes}
      busy={create.isPending || setReport.isPending}
      failed={create.isError || setReport.isError}
      onAdd={(episodeId) => setReport.mutate({ reportId, episodeId })}
      onCreate={(name) => create.mutate({ profileId, name, reportIds: [reportId] })}
      onRemove={() => setReport.mutate({ reportId, episodeId: null })}
    />
  );
}
