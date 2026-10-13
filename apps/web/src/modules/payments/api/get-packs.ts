import { api } from "@/lib/api";

export async function getPacks() {
  const res = await api.payments.packs.$get();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
