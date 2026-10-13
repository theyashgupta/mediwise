import { Info } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { ScoreRing } from "@/common/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { panelLabel } from "../config/report";
import type { ReportDetail } from "../types";

type ReportSummaryProps = {
  header: ReportDetail["header"];
  verdict: string | null;
};

export function ReportSummary({ header, verdict }: ReportSummaryProps) {
  const t = useT();
  const { measured, core } = header.coverage;
  const tier = header.tier ? t.report.summary.tiers[header.tier] : undefined;
  const [formulaOpen, setFormulaOpen] = useState(false);
  return (
    <section
      aria-labelledby="verdict"
      className="grid gap-6 rounded-xl border bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-8"
    >
      <div className="min-w-0 space-y-4">
        <h2 id="verdict" className="text-2xl font-semibold tracking-tight text-balance">
          {verdict ?? t.report.summary.score(header.score)}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {tier && <Badge variant="secondary">{tier}</Badge>}
          <Tooltip open={formulaOpen} onOpenChange={setFormulaOpen}>
            <TooltipTrigger
              onClick={(event) => {
                event.preventDefault();
                setFormulaOpen((open) => !open);
              }}
              className="inline-flex items-center gap-1.5 rounded-sm text-left text-muted-foreground underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {t.report.summary.coverage(
                panelLabel(header.coverage, header.capped),
                measured,
                core,
              )}
              <Info className="size-3.5 shrink-0" aria-hidden />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-pretty">{header.formula}</TooltipContent>
          </Tooltip>
        </div>
        {header.capped && (
          <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            {t.report.summary.capped(measured, core)}
          </p>
        )}
      </div>
      {header.score !== null && tier && (
        <ScoreRing score={header.score} tier={tier} size="md" className="sm:order-first" />
      )}
    </section>
  );
}
