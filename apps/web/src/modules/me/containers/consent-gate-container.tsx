import { type ReactNode, useEffect, useRef } from "react";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { ConsentGate } from "../components/consent-gate";
import { useConsents, useGiveConsents } from "../hooks/use-consents";

type ConsentGateContainerProps = {
  signUpConsentVersion: unknown;
  children: ReactNode;
};

export function ConsentGateContainer({
  signUpConsentVersion,
  children,
}: ConsentGateContainerProps) {
  const t = useT().me.consent;
  const consents = useConsents();
  const give = useGiveConsents();
  const autoSent = useRef(false);
  const missing = consents.data?.missing;
  const tickedAtSignUp =
    consents.data !== undefined && signUpConsentVersion === consents.data.policyVersion;
  const { mutate } = give;

  useEffect(() => {
    if (!missing?.length || !tickedAtSignUp || autoSent.current) return;
    autoSent.current = true;
    mutate(missing);
  }, [missing, tickedAtSignUp, mutate]);

  if (consents.isPending || signUpConsentVersion === undefined)
    return <LoadingState variant="card" />;
  if (consents.isError)
    return <ErrorState message={t.loadError} onRetry={() => consents.refetch()} />;
  if (!missing?.length) return children;
  if (tickedAtSignUp && !give.isError) return <LoadingState variant="card" />;
  return (
    <ConsentGate
      missing={missing}
      pending={give.isPending}
      error={give.error?.message}
      onAgree={() => give.mutate(missing)}
    />
  );
}
