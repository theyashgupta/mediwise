import type { ComponentProps } from "react";
import { GlassSurface } from "@/common/components/surface/glass";
import { useT } from "@/common/hooks/use-locale";
import { Mascot } from "@/modules/mascot";

export function AskLauncher(props: ComponentProps<"button">) {
  const t = useT().assistant.widget;
  return (
    <GlassSurface asChild layer="bar">
      <button
        type="button"
        data-testid="ask-launcher"
        aria-label={t.open}
        className="fixed right-[calc(--spacing(4)+env(safe-area-inset-right))] bottom-[calc(--spacing(5)+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full border shadow-(--shadow-glass) outline-none hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:transition motion-safe:duration-(--duration-fast) motion-safe:active:scale-90 md:bottom-4 print:hidden"
        {...props}
      >
        <Mascot size={48} />
      </button>
    </GlassSurface>
  );
}
