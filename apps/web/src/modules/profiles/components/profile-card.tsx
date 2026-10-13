import { Pencil, Trash2 } from "lucide-react";
import { ageOn } from "@/common/utils/age";
import { Button } from "@/components/ui/button";
import { relationLabels } from "../config/labels";
import type { Profile } from "../types";

type ProfileCardProps = {
  profile: Profile;
  onEdit: () => void;
  onRemove: () => void;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function ProfileCard({ profile, onEdit, onRemove }: ProfileCardProps) {
  const details = [
    relationLabels[profile.relation],
    profile.dateOfBirth ? plural(ageOn(profile.dateOfBirth), "year") : "Date of birth missing",
    profile.reportCount === 0 ? "No reports" : plural(profile.reportCount, "report"),
  ];
  return (
    <article className="flex h-full items-center gap-3 rounded-xl border bg-card px-4 py-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary uppercase"
        aria-hidden
      >
        {profile.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-medium">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${profile.name}`}>
          <Pencil aria-hidden />
        </Button>
        {!profile.isSelf && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove ${profile.name}`}
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>
    </article>
  );
}
