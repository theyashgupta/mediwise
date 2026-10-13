import { ProfileSwitcher, type ProfileSwitcherPlacement } from "../components/profile-switcher";
import { useActiveProfile } from "../hooks/use-active-profile";

export function ProfileSwitcherContainer({ placement }: { placement: ProfileSwitcherPlacement }) {
  const { profile, profiles, setActiveProfileId } = useActiveProfile();
  return (
    <ProfileSwitcher
      profiles={profiles}
      active={profile}
      placement={placement}
      onSelect={setActiveProfileId}
    />
  );
}
