import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { chipTarget, chipText } from "../config/chips";
import type { Cite, FactTarget } from "../types";

type CitationChipProps = {
  cite: Cite;
  onFact: (target: FactTarget) => void;
};

const chipClass =
  "inline-flex min-h-11 max-w-full items-center rounded-md border bg-card px-3 py-1.5 text-left text-sm wrap-anywhere";
const tappable = "hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 outline-none";

export function CitationChip({ cite, onFact }: CitationChipProps) {
  const target = chipTarget(cite);
  const text = chipText(cite);
  if (target.kind === "fact") {
    return (
      <button
        type="button"
        data-testid="assistant-chip"
        className={cn(chipClass, tappable)}
        onClick={() => onFact({ reportId: target.reportId, markerKey: target.markerKey })}
      >
        {text}
      </button>
    );
  }
  if (target.kind === "report") {
    return (
      <Link
        data-testid="assistant-chip"
        className={cn(chipClass, tappable)}
        to="/reports/$reportId"
        params={{ reportId: target.reportId }}
        hash={target.hash}
      >
        {text}
      </Link>
    );
  }
  if (target.kind === "episode") {
    return (
      <Link
        data-testid="assistant-chip"
        className={cn(chipClass, tappable)}
        to="/episodes/$episodeId"
        params={{ episodeId: target.episodeId }}
      >
        {text}
      </Link>
    );
  }
  return (
    <span
      data-testid={cite.deleted ? "assistant-chip-deleted" : "assistant-chip"}
      className={cn(chipClass, "text-muted-foreground")}
    >
      {text}
    </span>
  );
}
