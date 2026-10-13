import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { creditsLeftLabel } from "../config/credits";

type CreditsInfoProps = {
  credits: number;
  canBuy: boolean;
};

export function CreditsInfo({ credits, canBuy }: CreditsInfoProps) {
  const t = useT();
  return (
    <div className="max-w-measure space-y-4">
      <p className="text-lg font-semibold" data-testid="credits-balance">
        {credits > 0 ? creditsLeftLabel(credits) : t.credits.none}
      </p>
      <p>{t.credits.eachReport}</p>
      <p>{t.credits.refund}</p>
      {!canBuy && (
        <>
          <p>{t.credits.cannotBuy}</p>
          <p>{t.credits.contact}</p>
        </>
      )}
      <Button asChild variant="outline">
        <Link to="/reports">{t.credits.goToReports}</Link>
      </Button>
    </div>
  );
}
