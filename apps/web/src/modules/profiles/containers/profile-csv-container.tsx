import { useT } from "@/common/hooks/use-locale";
import { ProfileCsvButton } from "../components/profile-csv-button";
import { useActiveProfile } from "../hooks/use-active-profile";
import { useProfileCsv } from "../hooks/use-profiles";

export function ProfileCsvContainer() {
  const { profile } = useActiveProfile();
  const csv = useProfileCsv();
  const t = useT();
  if (!profile) return null;
  return (
    <ProfileCsvButton
      caption={t.profiles.rowsFor(t.profiles.rows(profile.valueCount), profile.name)}
      downloading={csv.isPending}
      error={csv.error?.message}
      onDownload={() => csv.mutate(profile)}
    />
  );
}
