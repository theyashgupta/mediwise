import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { GlassSurface } from "@/common/components/surface/glass";

type AskPanelProps = {
  open: boolean;
  trigger: ReactNode;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
};

export function AskPanel({ open, trigger, children, onOpenChange }: AskPanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/10 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 md:bg-transparent" />
        <GlassSurface asChild layer="surface">
          <DialogPrimitive.Content
            data-testid="ask-panel"
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-env(safe-area-inset-top)-(--spacing(2)))] flex-col overflow-hidden rounded-t-3xl border-t text-sm outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 motion-reduce:animate-none md:inset-x-auto md:right-4 md:bottom-4 md:h-[min(600px,calc(100dvh-(--spacing(8))))] md:w-[400px] md:origin-bottom-right md:rounded-3xl md:border md:data-open:zoom-in-95 md:data-open:slide-in-from-bottom-0 md:data-closed:zoom-out-95 md:data-closed:slide-out-to-bottom-0"
          >
            {children}
          </DialogPrimitive.Content>
        </GlassSurface>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
