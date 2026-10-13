import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEpisode, getEpisodes } from "../api/get-episodes";
import {
  createEpisode,
  deleteEpisode,
  dismissProposal,
  setReportEpisode,
  updateEpisode,
} from "../api/save-episode";

export function useEpisodes(profileId: string | undefined) {
  return useQuery({
    queryKey: ["episodes", "profile", profileId],
    queryFn: () => getEpisodes(profileId ?? ""),
    enabled: Boolean(profileId),
  });
}

export function useEpisode(id: string) {
  return useQuery({ queryKey: ["episodes", id], queryFn: () => getEpisode(id) });
}

/**
 * Changes episodes, then loads every episode and trend again.
 *
 * @remarks
 * The trend tooltips name the episode of each point, so a change to an episode changes the trend pages too.
 */
export function useEpisodeMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["episodes"] }),
      queryClient.invalidateQueries({ queryKey: ["trends"] }),
    ]);
  return {
    create: useMutation({ mutationFn: createEpisode, onSuccess }),
    dismiss: useMutation({ mutationFn: dismissProposal, onSuccess }),
    update: useMutation({ mutationFn: updateEpisode, onSuccess }),
    remove: useMutation({ mutationFn: deleteEpisode, onSuccess }),
    setReport: useMutation({ mutationFn: setReportEpisode, onSuccess }),
  };
}
