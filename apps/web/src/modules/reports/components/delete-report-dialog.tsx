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

type DeleteReportDialogProps = {
  open: boolean;
  deleting: boolean;
  error?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function DeleteReportDialog({
  open,
  deleting,
  error,
  onConfirm,
  onOpenChange,
}: DeleteReportDialogProps) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.report.deleteDialog.title}</DialogTitle>
          <DialogDescription>{t.report.deleteDialog.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t.report.deleteDialog.cancel}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? t.report.deleteDialog.deleting : t.report.deleteDialog.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
