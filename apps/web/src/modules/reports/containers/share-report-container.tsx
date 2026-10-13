import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GlassButton } from "@/common/components/surface/glass";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "../components/share-dialog";
import { shareDate, shareUrl } from "../config/share";
import { useCreateShare, useEndShare } from "../hooks/use-shares";

type ShareReportContainerProps = { reportId: string; glass?: boolean };

export function ShareReportContainer({ reportId, glass = false }: ShareReportContainerProps) {
  const create = useCreateShare();
  const end = useEndShare();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const share = create.data;
  const link = share && {
    url: shareUrl(window.location.origin, share.token),
    endsOn: shareDate(share.expiresAt),
  };

  const label = (
    <>
      <Share2 aria-hidden />
      Share with your doctor
    </>
  );

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
      () => toast.error("We could not copy the link. Select the link and copy it."),
    );
  }

  function endLink() {
    if (!share) return;
    end.mutate(
      { reportId, shareId: share.id },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("We ended the link.");
        },
      },
    );
  }

  return (
    <>
      {glass ? (
        <GlassButton onClick={start}>{label}</GlassButton>
      ) : (
        <Button variant="outline" onClick={start}>
          {label}
        </Button>
      )}
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
