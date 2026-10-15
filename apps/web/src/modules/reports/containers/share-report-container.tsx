import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/common/hooks/use-locale";
import { IconAction } from "@/common/components/icon-action";
import { ShareDialog } from "../components/share-dialog";
import { shareDate, shareUrl } from "../config/share";
import { useCreateShare, useEndShare } from "../hooks/use-shares";

type ShareReportContainerProps = { reportId: string };

export function ShareReportContainer({ reportId }: ShareReportContainerProps) {
  const t = useT();
  const create = useCreateShare();
  const end = useEndShare();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const share = create.data;
  const link = share && {
    url: shareUrl(window.location.origin, share.token),
    endsOn: shareDate(share.expiresAt),
  };

  function start() {
    end.reset();
    setCopied(false);
    setOpen(true);
    create.mutate(reportId);
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link.url).then(
      () => setCopied(true),
      () => toast.error(t.reports.share.copyError),
    );
  }

  function endLink() {
    if (!share) return;
    end.mutate(
      { reportId, shareId: share.id },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success(t.reports.share.ended);
        },
      },
    );
  }

  return (
    <>
      <IconAction label={t.reports.share.button} onClick={start} data-testid="report-share">
        <Share2 aria-hidden />
      </IconAction>
      <ShareDialog
        open={open}
        link={create.isSuccess ? link : undefined}
        error={create.error?.message ?? end.error?.message}
        copied={copied}
        ending={end.isPending}
        onCopy={copy}
        onEnd={endLink}
        onOpenChange={setOpen}
      />
    </>
  );
}
