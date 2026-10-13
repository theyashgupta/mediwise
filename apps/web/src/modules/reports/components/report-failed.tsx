import { CircleAlert, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportFailedProps = {
  message: string;
  retrying: boolean;
  retryError?: string;
  onRetry: () => void;
};

export function ReportFailed({ message, retrying, retryError, onRetry }: ReportFailedProps) {
  return (
    <section role="alert" className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex min-w-0 flex-1 items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          {message}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RotateCw aria-hidden className={retrying ? "animate-spin" : undefined} />
          Read it again
        </Button>
      </div>
      {retryError && <p className="text-sm text-destructive">{retryError}</p>}
    </section>
  );
}
