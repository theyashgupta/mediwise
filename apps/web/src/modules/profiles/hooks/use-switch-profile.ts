import { type RegisteredRouter, type RouteIds, useRouter } from "@tanstack/react-router";
import { setActiveProfileId, useActiveProfile } from "./use-active-profile";

const profilePages = new Set<RouteIds<RegisteredRouter["routeTree"]>>([
  "/_app/reports/$reportId",
  "/_app/reports/$reportId_/markers/$markerKey",
  "/_app/episodes/$episodeId",
]);

/**
 * Returns the handler that makes a profile active from the switcher.
 *
 * @remarks
 * A report, marker or episode page belongs to one profile, so a switch there opens the new profile's reports, or home when it has none.
 */
export function useSwitchProfile() {
  const router = useRouter();
  const { profile: active, profiles } = useActiveProfile();
  return (id: string) => {
    if (id === active?.id) return;
    setActiveProfileId(id);
    const routeId = router.state.matches.at(-1)?.routeId;
    if (!routeId || !profilePages.has(routeId)) return;
    const reportCount = profiles.find((profile) => profile.id === id)?.reportCount ?? 0;
    void router.navigate({ to: reportCount > 0 ? "/reports" : "/" });
  };
}
