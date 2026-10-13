import { GlassDialogContent } from "@/common/components/surface/glass";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { navItems } from "./nav";

const kbd =
  "inline-flex h-6 min-w-6 items-center justify-center rounded-md border bg-muted px-1.5 font-mono text-xs";

const rows = [
  ...navItems.map(({ key, label }) => ({
    keys: ["G", key.toUpperCase()],
    action: `Go to ${label}`,
  })),
  { keys: ["["], action: "Collapse or expand the sidebar" },
  { keys: ["?"], action: "Show the keyboard shortcuts" },
];

type ShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <GlassDialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Press G, then a letter, to go to a page.</DialogDescription>
        </DialogHeader>
        <dl className="divide-y">
          {rows.map(({ keys, action }) => (
            <div key={action} className="flex items-center justify-between gap-4 py-2">
              <dt className="text-sm">{action}</dt>
              <dd className="flex items-center gap-1 text-xs text-muted-foreground">
                {keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1">
                    {index > 0 && "then"}
                    <kbd className={kbd}>{key}</kbd>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </GlassDialogContent>
    </Dialog>
  );
}
