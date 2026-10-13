import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { ProblemError } from "@/common/utils/problem-error";
import { PackList } from "../components/pack-list";
import { PurchaseStatus } from "../components/purchase-status";
import { useBuyPack, useOrder, usePacks } from "../hooks/use-payments";

type BuyCreditsContainerProps = {
  returnedOrderId?: string;
};

export function BuyCreditsContainer({ returnedOrderId }: BuyCreditsContainerProps) {
  const t = useT();
  const packs = usePacks();
  const buy = useBuyPack();
  const order = useOrder(buy.data ?? returnedOrderId);
  const status = order.data?.status === "paid" ? "paid" : order.late ? "late" : "waiting";

  if (packs.isPending) return <LoadingState variant="card" />;
  if (packs.isError) {
    return <ErrorState message={t.payments.buy.loadError} onRetry={() => packs.refetch()} />;
  }
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">{t.payments.buy.title}</h2>
      <PackList
        packs={packs.data}
        buyingPackId={buy.isPending ? buy.variables : undefined}
        onBuy={(packId) => buy.mutate(packId)}
      />
      {buy.isError && (
        <p role="alert" className="text-destructive">
          {buy.error instanceof ProblemError ? buy.error.message : t.payments.buy.checkoutError}
        </p>
      )}
      {order.data && <PurchaseStatus status={status} credits={order.data.credits} />}
    </section>
  );
}
