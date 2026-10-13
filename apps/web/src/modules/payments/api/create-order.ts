import { api } from "@/lib/api";
import { problemError } from "@/common/utils/problem-error";

export async function createOrder(packId: string) {
  const res = await api.payments.orders.$post({ json: { packId } });
  if (!res.ok) throw await problemError(res);
  return res.json();
}
