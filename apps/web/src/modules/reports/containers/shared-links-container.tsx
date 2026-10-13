import { toast } from "sonner";
import { useT } from "@/common/hooks/use-locale";
import { ShareList } from "../components/share-list";
import { useEndShare, useShares } from "../hooks/use-shares";

export function SharedLinksContainer({ reportId }: { reportId: string }) {
  const t = useT();
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
            onSuccess: () => toast.success(t.reports.share.ended),
            onError: (error) => toast.error(error.message),
          },
        )
      }
    />
  );
}
