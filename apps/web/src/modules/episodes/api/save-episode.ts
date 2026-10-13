import { problemError } from "@/common/utils/problem-error";
import { api } from "@/lib/api";

export async function createEpisode({
  profileId,
  ...json
}: {
  profileId: string;
  name: string;
  note?: string;
  reportIds: string[];
}) {
  const res = await api.profiles[":id"].episodes.$post({ param: { id: profileId }, json });
  if (!res.ok) throw await problemError(res);
  return res.json();
}

export async function dismissProposal(profileId: string) {
  const res = await api.profiles[":id"].episodes.dismiss.$post({ param: { id: profileId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}

export async function updateEpisode({
  id,
  ...json
}: {
  id: string;
  name?: string;
  note?: string;
  endedOn?: string | null;
}) {
  const res = await api.episodes[":id"].$patch({ param: { id }, json });
  if (!res.ok) throw await problemError(res);
  return res.json();
}

export async function deleteEpisode(id: string) {
  const res = await api.episodes[":id"].$delete({ param: { id } });
  if (!res.ok) throw await problemError(res);
}

export async function setReportEpisode({
  reportId,
  episodeId,
}: {
  reportId: string;
  episodeId: string | null;
}) {
  const res = await api.reports[":id"].episode.$put({
    param: { id: reportId },
    json: { episodeId },
  });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
