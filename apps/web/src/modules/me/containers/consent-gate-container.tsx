import { requiredConsentKinds } from "@mediwise/shared";
import { type ReactNode, useEffect, useRef } from "react";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { ConsentGate } from "../components/consent-gate";
import { useConsents, useGiveConsents } from "../hooks/use-consents";

type ConsentGateContainerProps = {
  signUpConsentVersion: unknown;
  onGiven?: () => void;
  children: ReactNode;
};

/**
 * Tells whether a stored consent is one the upload page asks for.
 *
 * @remarks
 * The sign-up boxes stand in for the gate only until the first required row exists, so a later policy change or withdrawal always shows the gate.
 */
function isRequiredKind(kind: string) {
  return (requiredConsentKinds as readonly string[]).includes(kind);
}

export function ConsentGateContainer({
  signUpConsentVersion,
  onGiven,
  children,
}: ConsentGateContainerProps) {
  const t = useT().me.consent;
  const consents = useConsents();
  const give = useGiveConsents();
  const autoSent = useRef(false);
  const missing = consents.data?.missing;
  const tickedAtSignUp =
    consents.data !== undefined &&
    signUpConsentVersion === consents.data.policyVersion &&
    !consents.data.consents.some(({ kind }) => isRequiredKind(kind));
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
      onAgree={() => give.mutate(missing, { onSuccess: onGiven })}
    />
  );
}
