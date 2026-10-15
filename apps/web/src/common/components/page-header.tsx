import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "./surface/glass";

type PageHeaderProps = {
  title: string;
  heading?: ReactNode;
  description?: string;
  actions?: ReactNode;
  tools?: ReactNode;
  glass?: boolean;
};

export function PageHeader({
  title,
  heading,
  description,
  actions,
  tools,
  glass,
}: PageHeaderProps) {
  const className = cn(
    "mb-10 flex flex-col gap-4",
    !tools && "xl:flex-row xl:items-end xl:justify-between",
  );
  const intro = (
    <div className="min-w-0 flex-1 space-y-2 xl:min-w-96">
      {heading ?? <h1 className="font-display text-display text-balance wrap-anywhere">{title}</h1>}
      {description && <p className="max-w-measure text-muted-foreground">{description}</p>}
    </div>
  );
  const content = (
    <>
      {tools ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {intro}
          <div
            className="order-first flex shrink-0 gap-1 self-end sm:order-none sm:self-start"
            data-testid="page-tools"
          >
            {tools}
          </div>
        </div>
      ) : (
        intro
      )}
      {actions && (
        <div className={cn("flex flex-wrap gap-2", !tools && "xl:justify-end")}>{actions}</div>
      )}
    </>
  );
  if (!glass) return <header className={className}>{content}</header>;
  return (
    <GlassSurface asChild className={cn(className, "rounded-2xl border p-5 sm:p-8")}>
      <header>{content}</header>
    </GlassSurface>
  );
}
