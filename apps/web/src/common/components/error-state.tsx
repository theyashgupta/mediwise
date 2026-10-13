import { CircleAlert, RotateCw } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useT();
  return (
    <section
      role="alert"
      className="flex flex-col items-start gap-4 rounded-xl border bg-card px-6 py-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        {message}
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw aria-hidden />
        {t.common.retry}
      </Button>
    </section>
  );
}
