import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { getRouteApi } from "@tanstack/react-router";
import { useMe } from "@/modules/me";
import { BuyCreditsContainer, paymentsEnabled } from "@/modules/payments";
import { CreditsInfo } from "../components/credits-info";

const route = getRouteApi("/_app/credits");

export function CreditsContainer() {
  const t = useT();
  const me = useMe();
  const { order } = route.useSearch();
  return (
    <>
      <PageHeader title={t.credits.title} description={t.credits.description} />
      {me.isPending && <LoadingState variant="card" />}
      {me.isError && <ErrorState message={t.credits.loadError} onRetry={() => me.refetch()} />}
      {me.data && (
        <div className="space-y-10">
          <CreditsInfo credits={me.data.credits} canBuy={paymentsEnabled} />
          {paymentsEnabled && <BuyCreditsContainer returnedOrderId={order} />}
        </div>
      )}
    </>
  );
}
