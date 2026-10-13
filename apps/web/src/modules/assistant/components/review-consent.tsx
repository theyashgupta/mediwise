import { useT } from "@/common/hooks/use-locale";
import { Checkbox } from "@/components/ui/checkbox";

type ReviewConsentProps = {
  pending: boolean;
  error?: string;
  onAgree: () => void;
};

export function ReviewConsent({ pending, error, onAgree }: ReviewConsentProps) {
  const t = useT().assistant;
  return (
    <div
      data-testid="assistant-consent"
      className="mb-3 space-y-2 rounded-xl border border-dashed px-4 py-3"
    >
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <Checkbox
          data-testid="assistant-consent-box"
          className="mt-1"
          checked={pending}
          aria-disabled={pending || undefined}
          onCheckedChange={(checked) => checked === true && !pending && onAgree()}
        />
        <span>{t.consent}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
