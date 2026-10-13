import { toast } from "sonner";
import { ShareList } from "../components/share-list";
import { useEndShare, useShares } from "../hooks/use-shares";

export function SharedLinksContainer({ reportId }: { reportId: string }) {
  const shares = useShares(reportId);
  const end = useEndShare();
  if (!shares.data) return null;
  return (
    <ShareList
      links={shares.data}
      endingId={end.isPending ? end.variables.shareId : undefined}
      onEnd={(shareId) =>
        end.mutate(
          { reportId, shareId },
          {
            onSuccess: () => toast.success("We ended the link."),
            onError: (error) => toast.error(error.message),
          },
        )
      }
    />
  );
}
