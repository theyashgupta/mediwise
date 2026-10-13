import { isMinor } from "@mediwise/shared";
import { ConsentPrompt } from "../components/consent-prompt";
import { useConfirmConsent, useProfiles } from "../hooks/use-profiles";
import type { Profile } from "../types";

const needsGuardian = (profile: Profile) =>
  profile.dateOfBirth !== null && isMinor(profile.dateOfBirth) && !profile.guardianConfirmedAt;

export function ConsentPromptContainer() {
  const profiles = useProfiles();
  const confirm = useConfirmConsent();
  const family = profiles.data?.filter((profile) => !profile.isSelf) ?? [];
  const missingPermission = family.filter((profile) => !profile.permissionConfirmedAt);
  const missingGuardian = family.filter(needsGuardian);
  const pending = family.filter(
    (profile) => missingPermission.includes(profile) || missingGuardian.includes(profile),
  );
  if (pending.length === 0) return null;

  return (
    <ConsentPrompt
      permissionNames={missingPermission.map((profile) => profile.name)}
      guardianNames={missingGuardian.map((profile) => profile.name)}
      confirming={confirm.isPending}
      error={confirm.error?.message}
      onConfirm={() =>
        confirm.mutate(
          pending.map((profile) => ({
            id: profile.id,
            input: { permissionConfirmed: true, guardianConfirmed: needsGuardian(profile) },
          })),
        )
      }
    />
  );
}
