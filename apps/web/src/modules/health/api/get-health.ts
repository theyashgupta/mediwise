import { api } from "@/lib/api";

export async function getHealth() {
  const res = await api.health.$get();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
