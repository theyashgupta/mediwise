import type { HealthResponse } from "@mediwise/shared";

export function getHealth(): HealthResponse {
  return { status: "ok", time: new Date().toISOString() };
}
