import { ProfileSwitcher, type ProfileSwitcherPlacement } from "../components/profile-switcher";
import { useActiveProfile } from "../hooks/use-active-profile";
import { useSwitchProfile } from "../hooks/use-switch-profile";

export function ProfileSwitcherContainer({ placement }: { placement: ProfileSwitcherPlacement }) {
  const { profile, profiles } = useActiveProfile();
  const switchProfile = useSwitchProfile();
  return (
    <ProfileSwitcher
      profiles={profiles}
      active={profile}
      placement={placement}
      onSelect={switchProfile}
    />
  );
}
