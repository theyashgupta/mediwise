import { HealthStatus } from "../components/health-status";
import { useHealth } from "../hooks/use-health";

export function HealthContainer() {
  const health = useHealth();
  const state = health.isPending ? "checking" : health.isError ? "down" : health.data.status;
  return (
    <HealthStatus state={state} refreshing={health.isFetching} onRefresh={() => health.refetch()} />
  );
}
