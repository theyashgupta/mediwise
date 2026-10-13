import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type InstallHintSheetProps = { open: boolean; onClose: () => void };

export function InstallHintSheet({ open, onClose }: InstallHintSheetProps) {
  const t = useT().dashboard.install.ios;
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        data-testid="install-hint"
        className="pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.body}</SheetDescription>
        </SheetHeader>
        <ol className="list-decimal space-y-2 pr-4 pl-8">
          {t.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <SheetFooter>
          <SheetClose asChild>
            <Button>{t.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
