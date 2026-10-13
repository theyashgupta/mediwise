import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder } from "../api/create-order";
import { getOrder } from "../api/get-order";
import { getPacks } from "../api/get-packs";
import { loadCashfree } from "../api/load-cashfree";
import { orderPollLimitMs, orderPollMs } from "../config/payments";

export function usePacks() {
  return useQuery({ queryKey: ["payments", "packs"], queryFn: getPacks });
}

/**
 * Creates an order for a pack and opens Cashfree checkout over the page.
 *
 * @remarks
 * Resolves to the order id when checkout reports a finished payment, and to undefined when the user closes it.
 * A finished payment is not a paid order yet, so the caller polls the order.
 */
export function useBuyPack() {
  return useMutation({
    mutationFn: async (packId: string) => {
      const order = await createOrder(packId);
      const cashfree = await loadCashfree();
      const result = await cashfree.checkout({
        paymentSessionId: order.sessionId,
        redirectTarget: "_modal",
      });
      return result.paymentDetails ? order.id : undefined;
    },
  });
}

const isWaiting = (status: string | undefined, polls: number) =>
  status === "created" && polls * orderPollMs < orderPollLimitMs;

/**
 * Polls one order until it is paid or two minutes pass, and refreshes the balance when it is paid.
 *
 * @remarks
 * The webhook credits the order, so the page waits for it instead of trusting the checkout result.
 */
export function useOrder(id: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["payments", "orders", id];
  const query = useQuery({
    queryKey,
    enabled: Boolean(id),
    queryFn: async () => {
      const order = await getOrder(id ?? "");
      if (order.status === "paid") await queryClient.invalidateQueries({ queryKey: ["me"] });
      return order;
    },
    refetchInterval: (q) =>
      isWaiting(q.state.data?.status, q.state.dataUpdateCount) ? orderPollMs : false,
  });
  const polls = queryClient.getQueryState(queryKey)?.dataUpdateCount ?? 0;
  const late = query.data?.status === "created" && !isWaiting(query.data.status, polls);
  return { ...query, late };
}
