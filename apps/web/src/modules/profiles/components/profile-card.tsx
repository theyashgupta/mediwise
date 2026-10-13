import { Link } from "@tanstack/react-router";
import { CalendarRange, Pencil, Trash2 } from "lucide-react";
import { ageOn } from "@/common/utils/age";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approximateBirthNote, relationLabels, rowCountLabel } from "../config/labels";
import type { Profile } from "../types";
import { ProfileCsvButton } from "./profile-csv-button";

type ProfileCardProps = {
  profile: Profile;
  onEdit: () => void;
  onRemove: () => void;
  downloading: boolean;
  downloadError?: string;
  onDownload: () => void;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function ProfileCard({
  profile,
  onEdit,
  onRemove,
  downloading,
  downloadError,
  onDownload,
}: ProfileCardProps) {
  const details = [
    relationLabels[profile.relation],
    profile.dateOfBirth ? plural(ageOn(profile.dateOfBirth), "year") : "Date of birth missing",
    profile.reportCount === 0 ? "No reports" : plural(profile.reportCount, "report"),
  ];
  return (
    <article
      className="flex h-full flex-col gap-4 rounded-xl border bg-card px-4 py-4"
      data-testid="profile-card"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary uppercase"
          aria-hidden
        >
          {profile.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
          {profile.dateOfBirthApproximate && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <Badge variant="secondary">Approximate</Badge>
              {approximateBirthNote}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {profile.reportCount >= 2 && (
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/year-review"
                search={{ profileId: profile.id }}
                aria-label={`Year in review for ${profile.name}`}
              >
                <CalendarRange aria-hidden />
              </Link>
            </Button>
          )}
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
      </div>
      <ProfileCsvButton
        caption={rowCountLabel(profile.valueCount)}
        downloading={downloading}
        error={downloadError}
        onDownload={onDownload}
      />
    </article>
  );
}
