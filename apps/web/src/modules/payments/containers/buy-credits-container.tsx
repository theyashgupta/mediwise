import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { ProblemError } from "@/common/utils/problem-error";
import { PackList } from "../components/pack-list";
import { PurchaseStatus } from "../components/purchase-status";
import { useBuyPack, useOrder, usePacks } from "../hooks/use-payments";

type BuyCreditsContainerProps = {
  returnedOrderId?: string;
};

export function BuyCreditsContainer({ returnedOrderId }: BuyCreditsContainerProps) {
  const packs = usePacks();
  const buy = useBuyPack();
  const order = useOrder(buy.data ?? returnedOrderId);
  const status = order.data?.status === "paid" ? "paid" : order.late ? "late" : "waiting";

  if (packs.isPending) return <LoadingState variant="card" />;
  if (packs.isError) {
    return (
      <ErrorState message="We could not load the credit packs." onRetry={() => packs.refetch()} />
    );
  }
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Buy report credits</h2>
      <PackList
        packs={packs.data}
        buyingPackId={buy.isPending ? buy.variables : undefined}
        onBuy={(packId) => buy.mutate(packId)}
      />
      {buy.isError && (
        <p role="alert" className="text-destructive">
          {buy.error instanceof ProblemError
            ? buy.error.message
            : "The payment window did not open. Try again."}
        </p>
      )}
      {order.data && <PurchaseStatus status={status} credits={order.data.credits} />}
    </section>
  );
}
