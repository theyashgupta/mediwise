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

type RemoveProfileDialogProps = {
  name?: string;
  removing: boolean;
  error?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function RemoveProfileDialog({
  name,
  removing,
  error,
  onConfirm,
  onOpenChange,
}: RemoveProfileDialogProps) {
  const t = useT();
  const text = t.profiles.remove;
  return (
    <Dialog open={name !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{text.title(name ?? "")}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{text.cancel}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={removing}>
            {removing ? text.removing : text.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
