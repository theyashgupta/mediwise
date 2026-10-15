import { Layers } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { formatEpisodeDate } from "../config/episodes";
import type { Proposal } from "../types";
import { EpisodeFields } from "./episode-fields";
import { wrapLabel } from "@/common/utils/wrap-label";

type EpisodeProposalProps = {
  proposal: Proposal;
  busy: boolean;
  failed: boolean;
  onSave: (fields: { name: string; note: string }) => void;
  onDismiss: () => void;
};

export function EpisodeProposal({
  proposal,
  busy,
  failed,
  onSave,
  onDismiss,
}: EpisodeProposalProps) {
  const t = useT().episodes.proposal;
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      aria-labelledby="episode-proposal"
      data-testid="episode-proposal"
      className="space-y-4 rounded-xl border bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim(), note: note.trim() });
      }}
    >
      <div className="flex gap-3">
        <Layers className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
        <div className="space-y-1">
          <h2 id="episode-proposal" className="text-lg font-semibold tracking-tight">
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.body(
              proposal.reportIds.length,
              formatEpisodeDate(proposal.from),
              formatEpisodeDate(proposal.to),
            )}
          </p>
        </div>
      </div>
      <EpisodeFields
        id="episode-proposal"
        name={name}
        note={note}
        onNameChange={setName}
        onNoteChange={setNote}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className={wrapLabel}
          disabled={busy || !name.trim()}
          data-testid="episode-proposal-save"
        >
          {busy ? t.saving : t.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          className={wrapLabel}
          disabled={busy}
          onClick={onDismiss}
        >
          {t.dismiss}
        </Button>
      </div>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {t.failed}
        </p>
      )}
    </form>
  );
}
