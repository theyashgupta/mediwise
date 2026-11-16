import { useEffect } from "react";
import { setActiveProfileId } from "./use-active-profile";

/**
 * Makes the profile that owns the open report, marker or episode the active profile.
 *
 * @remarks
 * It runs only when the page's own profile changes, so a switch made on the page is not undone while the app navigates away.
 */
export function useEntityProfile(profileId: string | undefined) {
  useEffect(() => {
    if (profileId) setActiveProfileId(profileId);
  }, [profileId]);
}
