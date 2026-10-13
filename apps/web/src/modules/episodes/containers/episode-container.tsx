import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Layers } from "lucide-react";
import { toast } from "sonner";
import { useCrumbLabel } from "@/common/hooks/use-crumb-label";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { EpisodeSettings } from "../components/episode-settings";
import { EpisodeView } from "../components/episode-view";
import { formatEpisodeDate } from "../config/episodes";
import { useEpisode, useEpisodeMutations } from "../hooks/use-episodes";

const route = getRouteApi("/_app/episodes/$episodeId");

function BackLink() {
  const t = useT();
  return (
    <Button asChild variant="outline">
      <Link to="/profiles" hash="episodes">
        <ArrowLeft aria-hidden />
        {t.episodes.page.back}
      </Link>
    </Button>
  );
}

export function EpisodeContainer() {
  const { episodeId } = route.useParams();
  const navigate = useNavigate();
  const t = useT();
  const text = t.episodes;
  const episode = useEpisode(episodeId);
  const { update, remove } = useEpisodeMutations();
  useCrumbLabel(`/episodes/${episodeId}`, episode.data?.name);

  if (episode.isPending) return <LoadingState variant="page" />;
  if (episode.isError) {
    return <ErrorState message={text.page.loadError} onRetry={() => episode.refetch()} />;
  }
  const data = episode.data;
  if (!data) {
    return (
      <EmptyState
        icon={Layers}
        title={text.page.notFoundTitle}
        body={text.page.notFoundBody}
        action={<BackLink />}
      />
    );
  }

  const period = data.endedOn
    ? text.period(formatEpisodeDate(data.startedOn), formatEpisodeDate(data.endedOn))
    : text.openSince(formatEpisodeDate(data.startedOn));

  return (
    <>
      <PageHeader title={data.name} description={period} actions={<BackLink />} />
      <div className="space-y-12">
        <EpisodeView episode={data} />
        <EpisodeSettings
          key={`${data.name}:${data.note}`}
          name={data.name}
          note={data.note}
          ended={data.endedOn !== null}
          busy={update.isPending}
          failed={update.isError}
          deleting={remove.isPending}
          onSave={(fields) =>
            update.mutate(
              { id: episodeId, ...fields },
              { onSuccess: () => toast.success(text.settings.saved) },
            )
          }
          onToggleEnd={() =>
            update.mutate({
              id: episodeId,
              endedOn: data.endedOn ? null : (data.to ?? data.startedOn),
            })
          }
          onDelete={() =>
            remove.mutate(episodeId, {
              onSuccess: () => {
                toast.success(text.settings.deleted(data.name));
                void navigate({ to: "/profiles" });
              },
            })
          }
        />
      </div>
    </>
  );
}
