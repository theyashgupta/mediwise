import { Copy, LoaderCircle, MessageCircle } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { whatsAppLink } from "../config/share";

type ShareDialogProps = {
  open: boolean;
  link?: { url: string; endsOn: string };
  error?: string;
  copied: boolean;
  ending: boolean;
  onCopy: () => void;
  onEnd: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ShareDialog({
  open,
  link,
  error,
  copied,
  ending,
  onCopy,
  onEnd,
  onOpenChange,
}: ShareDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.reports.share.button}</DialogTitle>
          <DialogDescription>{t.reports.share.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!link && !error && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            {t.reports.share.making}
          </p>
        )}
        {link && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                readOnly
                value={link.url}
                aria-label={t.reports.share.linkLabel}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button variant="outline" onClick={onCopy}>
                <Copy aria-hidden />
                {copied ? t.reports.share.copied : t.reports.share.copy}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t.reports.share.endsOn(link.endsOn)}</p>
          </div>
        )}
        {link && (
          <DialogFooter>
            <Button variant="ghost" onClick={onEnd} disabled={ending}>
              {ending ? t.reports.share.ending : t.reports.share.end}
            </Button>
            <Button asChild>
              <a href={whatsAppLink(link.url)} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                {t.reports.share.whatsApp}
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
