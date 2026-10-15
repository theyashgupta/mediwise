import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const layers = {
  bar: "bg-glass-bar glass-blur-bar",
  surface: "bg-glass-surface glass-blur-surface shadow-(--shadow-glass)",
  overlay: "bg-glass-overlay shadow-(--shadow-glass)",
} as const;

type GlassSurfaceProps = ComponentProps<"div"> & {
  layer?: keyof typeof layers;
  asChild?: boolean;
};

export function GlassSurface({
  layer = "surface",
  asChild,
  className,
  ...props
}: GlassSurfaceProps) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp data-glass={layer} className={cn(layers[layer], className)} {...props} />;
}

export function GlassCard({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card data-glass="surface" className={cn(layers.surface, className)} {...props} />;
}

export function GlassDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent data-glass="overlay" className={cn(layers.overlay, className)} {...props} />
  );
}

export function GlassButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      variant="outline"
      className={cn(
        "bg-transparent hover:bg-foreground/5 active:bg-foreground/10 dark:hover:bg-foreground/8 dark:active:bg-foreground/12",
        className,
      )}
      {...props}
    />
  );
}

export function GlassBadge({ className, ...props }: Omit<ComponentProps<typeof Badge>, "variant">) {
  return (
    <Badge
      variant="outline"
      className={cn("bg-transparent font-normal text-muted-foreground", className)}
      {...props}
    />
  );
}
