import type { RequiredConsentKind } from "@mediwise/shared";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { CheckboxLine } from "@/common/components/checkbox-line";
import { Button } from "@/components/ui/button";
import { ConsentLabel } from "./consent-label";

type ConsentGateProps = {
  missing: RequiredConsentKind[];
  pending: boolean;
  error?: string;
  onAgree: () => void;
};

export function ConsentGate({ missing, pending, error, onAgree }: ConsentGateProps) {
  const t = useT().me.consent;
  const [ticked, setTicked] = useState<string[]>([]);
  const allTicked = missing.every((kind) => ticked.includes(kind));
  return (
    <section data-testid="consent-gate" className="space-y-4 rounded-xl border bg-card p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t.gateTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {missing.includes("terms") ? t.gateDescription : t.gateChanged}
        </p>
      </div>
      <div className="space-y-3">
        {missing.map((kind) => (
          <CheckboxLine
            key={kind}
            className="min-h-11"
            testId={`consent-${kind}`}
            checked={ticked.includes(kind)}
            onChange={(checked) =>
              setTicked((current) =>
                checked ? [...current, kind] : current.filter((item) => item !== kind),
              )
            }
          >
            <ConsentLabel kind={kind} />
          </CheckboxLine>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button data-testid="consent-submit" disabled={!allTicked || pending} onClick={onAgree}>
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {pending ? t.agreeing : t.agree}
      </Button>
    </section>
  );
}
