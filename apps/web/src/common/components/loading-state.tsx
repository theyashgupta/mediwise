import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  variant: "list" | "card" | "page";
};

export function LoadingState({ variant }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Loading</span>
      {variant === "page" && (
        <div className="space-y-3 pb-6">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      )}
      {(variant === "card" || variant === "page") && (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {(variant === "list" || variant === "page") && (
        <ul className="divide-y rounded-xl border bg-card">
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="flex items-center justify-between gap-4 p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-16" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
