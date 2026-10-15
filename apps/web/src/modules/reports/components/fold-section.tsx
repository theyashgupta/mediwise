import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type FoldSectionProps = {
  id: string;
  title: string;
  count?: number;
  summary?: ReactNode;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function FoldSection({
  id,
  title,
  count,
  summary,
  description,
  open,
  onOpenChange,
  children,
}: FoldSectionProps) {
  return (
    <details
      id={id}
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className="group scroll-mt-28 border-t"
    >
      <summary className="flex cursor-pointer list-none items-center gap-4 rounded-md py-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 space-y-1">
          <h2 className="flex items-baseline gap-2 text-xl font-semibold tracking-tight">
            {title}
            {count !== undefined && (
              <span className="font-mono text-base font-normal text-muted-foreground">{count}</span>
            )}
          </h2>
          {summary && (
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {typeof summary === "string" ? (
                <span className="min-w-0 truncate">{summary}</span>
              ) : (
                summary
              )}
            </span>
          )}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 pb-10">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
    </details>
  );
}
