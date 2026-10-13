import { api } from "@/lib/api";

export async function getMe() {
  const res = await api.me.$get();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
