import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ClearChatDialogProps = {
  open: boolean;
  clearing: boolean;
  error?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ClearChatDialog({
  open,
  clearing,
  error,
  onConfirm,
  onOpenChange,
}: ClearChatDialogProps) {
  const t = useT().assistant.clearDialog;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="min-h-11">
              {t.cancel}
            </Button>
          </DialogClose>
          <Button
            data-testid="assistant-clear-confirm"
            variant="destructive"
            className="min-h-11"
            onClick={onConfirm}
            disabled={clearing}
          >
            {clearing ? t.clearing : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
