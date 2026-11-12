import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/common/components/controls/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/common/components/controls/field";
import { Input } from "@/common/components/controls/input";

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
        <Field label={copy.confirm(confirmWord)}>
          <Input
            id="confirm-delete"
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </Field>
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
