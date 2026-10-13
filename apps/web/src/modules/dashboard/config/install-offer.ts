const dismissDays = 30;
const dayMs = 86_400_000;

export type InstallOffer = "banner" | "ios-hint" | undefined;

type InstallState = {
  visits: number;
  now: number;
  dismissedAt: number | undefined;
  hintSeen: boolean;
  canInstall: boolean;
  ios: boolean;
  standalone: boolean;
};

/**
 * Picks the install offer for Home: the Android banner, the one-time iOS hint, or nothing.
 *
 * @remarks
 * Both wait for the second visit, so a new user sees the app before we ask them to install it.
 */
export function installOffer(state: InstallState): InstallOffer {
  if (state.standalone || state.visits < 2) return undefined;
  if (state.canInstall) {
    const dismissed =
      state.dismissedAt !== undefined && state.now - state.dismissedAt < dismissDays * dayMs;
    return dismissed ? undefined : "banner";
  }
  return state.ios && !state.hintSeen ? "ios-hint" : undefined;
}

/**
 * Returns true on an iPhone or an iPad.
 *
 * @remarks
 * iPadOS Safari reports a Mac user agent, so a Mac with a touch screen counts as an iPad.
 */
export function isIos(userAgent: string, maxTouchPoints: number) {
  return (
    /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Macintosh") && maxTouchPoints > 1)
  );
}
