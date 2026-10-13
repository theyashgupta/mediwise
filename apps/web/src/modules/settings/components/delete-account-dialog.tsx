import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteAccountDialogProps = {
  open: boolean;
  deleting: boolean;
  error?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

const confirmWord = "DELETE";

export function DeleteAccountDialog({
  open,
  deleting,
  error,
  onConfirm,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const [typed, setTyped] = useState("");
  const t = useT();
  const copy = t.settings.deleteDialog;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">{copy.confirm(confirmWord)}</Label>
          <Input
            id="confirm-delete"
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{copy.cancel}</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={typed !== confirmWord || deleting}
          >
            {deleting ? copy.deleting : t.settings.data.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
