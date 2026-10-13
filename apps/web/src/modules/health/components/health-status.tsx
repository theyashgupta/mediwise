import { Button } from "@/components/ui/button";
import type { HealthState } from "../types";

type HealthStatusProps = {
  state: HealthState;
  refreshing: boolean;
  onRefresh: () => void;
};

export function HealthStatus({ state, refreshing, onRefresh }: HealthStatusProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <p className="font-mono text-lg">api: {state}</p>
      <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
        Check again
      </Button>
    </main>
  );
}
