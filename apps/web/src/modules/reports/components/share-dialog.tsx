import { Copy, LoaderCircle, MessageCircle } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share with your doctor</DialogTitle>
          <DialogDescription>
            Your doctor can open this link without an account. Anyone with the link can see this
            report. Send it only to your doctor.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!link && !error && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Making the link
          </p>
        )}
        {link && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                readOnly
                value={link.url}
                aria-label="Link to this report"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button variant="outline" onClick={onCopy}>
                <Copy aria-hidden />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">This link ends on {link.endsOn}.</p>
          </div>
        )}
        {link && (
          <DialogFooter>
            <Button variant="ghost" onClick={onEnd} disabled={ending}>
              {ending ? "Ending the link" : "End link"}
            </Button>
            <Button asChild>
              <a href={whatsAppLink(link.url)} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                Send on WhatsApp
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
