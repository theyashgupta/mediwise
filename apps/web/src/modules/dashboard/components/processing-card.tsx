import { LoaderCircle } from "lucide-react";

type ProcessingCardProps = {
  count: number;
};

export function ProcessingCard({ count }: ProcessingCardProps) {
  return (
    <section role="status" className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="font-medium">
          {count > 1 ? `Reading your ${count} reports` : "Reading your report"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {count > 1
            ? "This page updates when each report is ready."
            : "This page updates when the report is ready."}
        </p>
      </div>
    </section>
  );
}
