import { ProfileCsvButton } from "../components/profile-csv-button";
import { rowCountLabel } from "../config/labels";
import { useActiveProfile } from "../hooks/use-active-profile";
import { useProfileCsv } from "../hooks/use-profiles";

export function ProfileCsvContainer() {
  const { profile } = useActiveProfile();
  const csv = useProfileCsv();
  if (!profile) return null;
  return (
    <ProfileCsvButton
      caption={`${rowCountLabel(profile.valueCount)} for ${profile.name}`}
      downloading={csv.isPending}
      error={csv.error?.message}
      onDownload={() => csv.mutate(profile)}
    />
  );
}
