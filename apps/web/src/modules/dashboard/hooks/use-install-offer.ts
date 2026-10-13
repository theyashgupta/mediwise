import { useEffect, useState } from "react";
import { getVisits, promptInstall, useCanInstall } from "@/common/hooks/use-install-prompt";
import { installOffer, isIos } from "../config/install-offer";

const dismissedKey = "installDismissedAt";
const hintSeenKey = "installHintSeen";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    // eslint-disable-next-line no-empty
  } catch {}
}

/** Reads the stored install state and the time once, when Home opens. */
function readInstallState() {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return {
    now: Date.now(),
    visits: getVisits(),
    dismissedAt: Number(read(dismissedKey)) || undefined,
    hintSeen: read(hintSeenKey) === "1",
    ios: isIos(navigator.userAgent, navigator.maxTouchPoints),
    standalone,
  };
}

/**
 * Returns the install offer for Home and the actions that close it.
 *
 * @remarks
 * The iOS hint counts as seen when it opens, so it shows once even when the user leaves it open.
 */
export function useInstallOffer() {
  const canInstall = useCanInstall();
  const [stored] = useState(readInstallState);
  const [closed, setClosed] = useState(false);
  const offer = closed ? undefined : installOffer({ ...stored, canInstall });

  useEffect(() => {
    if (offer === "ios-hint") write(hintSeenKey, "1");
  }, [offer]);

  const dismiss = () => {
    write(dismissedKey, String(Date.now()));
    setClosed(true);
  };
  const install = async () => {
    setClosed(true);
    if (!(await promptInstall())) write(dismissedKey, String(Date.now()));
  };
  return { offer, install, dismiss, close: () => setClosed(true) };
}
