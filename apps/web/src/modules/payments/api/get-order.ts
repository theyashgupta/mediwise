import { api } from "@/lib/api";

export async function getOrder(id: string) {
  const res = await api.payments.orders[":id"].$get({ param: { id } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
