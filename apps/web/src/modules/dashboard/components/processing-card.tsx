import { LoaderCircle } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";

type ProcessingCardProps = {
  count: number;
};

export function ProcessingCard({ count }: ProcessingCardProps) {
  const text = useT().dashboard.processing;
  return (
    <section role="status" className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="font-medium">{count > 1 ? text.titleMany(count) : text.titleOne}</h2>
        <p className="text-sm text-muted-foreground">{count > 1 ? text.bodyMany : text.bodyOne}</p>
      </div>
    </section>
  );
}
