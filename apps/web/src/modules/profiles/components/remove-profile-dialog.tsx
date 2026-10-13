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
  return (
    <Dialog open={name !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {name}?</DialogTitle>
          <DialogDescription>
            This deletes the profile and every report uploaded for it. You cannot undo this.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={removing}>
            {removing ? "Removing" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
