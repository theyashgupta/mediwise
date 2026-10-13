import { EpisodeProposal } from "../components/episode-proposal";
import { useEpisodeMutations } from "../hooks/use-episodes";
import type { Proposal } from "../types";

type EpisodeProposalContainerProps = {
  profileId: string;
  proposal: Proposal;
};

export function EpisodeProposalContainer({ profileId, proposal }: EpisodeProposalContainerProps) {
  const { create, dismiss } = useEpisodeMutations();
  return (
    <EpisodeProposal
      key={proposal.reportIds.join()}
      proposal={proposal}
      busy={create.isPending || dismiss.isPending}
      failed={create.isError || dismiss.isError}
      onSave={({ name, note }) =>
        create.mutate({ profileId, name, note, reportIds: proposal.reportIds })
      }
      onDismiss={() => dismiss.mutate(profileId)}
    />
  );
}
