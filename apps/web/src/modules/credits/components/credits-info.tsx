import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { creditsLeftLabel } from "../config/credits";

type CreditsInfoProps = {
  credits: number;
  canBuy: boolean;
};

export function CreditsInfo({ credits, canBuy }: CreditsInfoProps) {
  return (
    <div className="max-w-measure space-y-4">
      <p className="text-lg font-semibold">
        {credits > 0 ? creditsLeftLabel(credits) : "You have no report credits left."}
      </p>
      <p>Each report that MediWise reads uses one report credit.</p>
      <p>When we cannot read a report, we return its credit to you.</p>
      {!canBuy && (
        <>
          <p>You cannot buy credits yet. Payments come in a later release.</p>
          <p>To get credits now, contact the MediWise team.</p>
        </>
      )}
      <Button asChild variant="outline">
        <Link to="/reports">Go to your reports</Link>
      </Button>
    </div>
  );
}
