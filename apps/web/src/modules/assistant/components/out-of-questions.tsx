import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import type { Me } from "../types";

type OutOfQuestionsProps = {
  step: NonNullable<Me["assistant"]["outOfQuestions"]>;
  pending: boolean;
  error?: string;
  onUseCredit: () => void;
};

export function OutOfQuestions({ step, pending, error, onUseCredit }: OutOfQuestionsProps) {
  const t = useT().assistant.out;
  return (
    <div
      data-testid="assistant-out"
      className="mb-3 space-y-3 rounded-xl border border-dashed px-4 py-3"
    >
      <p>{t[step]}</p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {step === "use_credit" && (
        <Button
          data-testid="assistant-use-credit"
          variant="secondary"
          className="min-h-11"
          disabled={pending}
          onClick={onUseCredit}
        >
          {t.useCredit}
        </Button>
      )}
      {step === "buy" && (
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/credits">{t.buyCredits}</Link>
        </Button>
      )}
      {step === "add_report" && (
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/reports/upload">{t.addReport}</Link>
        </Button>
      )}
    </div>
  );
}
