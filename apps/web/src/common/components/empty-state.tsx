import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-start gap-4 rounded-xl border border-dashed bg-card px-6 py-10 sm:px-10">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="max-w-measure text-muted-foreground">{body}</p>
      </div>
      {action}
    </section>
  );
}
