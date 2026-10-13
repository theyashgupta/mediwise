import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("reveal max-w-2xl", className)}>
      <p className="font-mono text-xs tracking-wider text-primary uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {title}
      </h2>
      {children && <p className="mt-4 text-lg text-pretty text-muted-foreground">{children}</p>}
    </div>
  );
}
