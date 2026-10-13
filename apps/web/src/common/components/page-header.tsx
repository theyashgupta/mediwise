import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "./surface/glass";

type PageHeaderProps = {
  title: string;
  heading?: ReactNode;
  description?: string;
  actions?: ReactNode;
  glass?: boolean;
};

export function PageHeader({ title, heading, description, actions, glass }: PageHeaderProps) {
  const className = "mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between";
  const content = (
    <>
      <div className="min-w-0 flex-1 space-y-2">
        {heading ?? <h1 className="font-display text-display text-balance">{title}</h1>}
        {description && <p className="max-w-measure text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </>
  );
  if (!glass) return <header className={className}>{content}</header>;
  return (
    <GlassSurface asChild className={cn(className, "rounded-2xl border p-5 sm:p-8")}>
      <header>{content}</header>
    </GlassSurface>
  );
}
