import { Link } from "@tanstack/react-router";
import { CalendarRange, Pencil, Trash2 } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { ageOn } from "@/common/utils/age";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function ProfileCard({
  profile,
  onEdit,
  onRemove,
  downloading,
  downloadError,
  onDownload,
}: ProfileCardProps) {
  const t = useT();
  const text = t.profiles.card;
  const details = [
    t.profiles.relation[profile.relation],
    profile.dateOfBirth ? text.years(ageOn(profile.dateOfBirth)) : text.dateOfBirthMissing,
    profile.reportCount === 0 ? text.noReports : text.reports(profile.reportCount),
  ];
  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border bg-card px-4 py-4">
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
              <Badge variant="secondary">{t.profiles.approximate}</Badge>
              {t.profiles.approximateBirthNote}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {profile.reportCount >= 2 && (
            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/year-review"
                search={{ profileId: profile.id }}
                aria-label={text.yearReview(profile.name)}
              >
                <CalendarRange aria-hidden />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={text.edit(profile.name)}>
            <Pencil aria-hidden />
          </Button>
          {!profile.isSelf && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label={text.remove(profile.name)}
            >
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
      </div>
      <ProfileCsvButton
        caption={t.profiles.rows(profile.valueCount)}
        downloading={downloading}
        error={downloadError}
        onDownload={onDownload}
      />
    </article>
  );
}
