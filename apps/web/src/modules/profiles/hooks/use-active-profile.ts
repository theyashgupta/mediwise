import { useSyncExternalStore } from "react";
import { useProfiles } from "./use-profiles";

const storageKey = "activeProfileId";
const listeners = new Set<() => void>();
let unsaved: string | null = null;

/**
 * Reads the stored active profile id.
 *
 * @remarks
 * Storage can throw in private windows, so the last choice is then kept in memory for this tab.
 */
function readStoredId() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return unsaved;
  }
}

export function setActiveProfileId(id: string) {
  unsaved = id;
  try {
    localStorage.setItem(storageKey, id);
    // eslint-disable-next-line no-empty
  } catch {}
  listeners.forEach((listener) => listener());
}

/**
 * Returns the profile every feature is scoped to, and a setter shared by every caller.
 *
 * @remarks
 * Falls back to the self profile when nothing is stored or the stored profile was removed.
 */
export function useActiveProfile() {
  const profiles = useProfiles();
  const storedId = useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, readStoredId);
  const list = profiles.data ?? [];
  const profile = list.find((p) => p.id === storedId) ?? list.find((p) => p.isSelf);
  return { profile, profiles: list, setActiveProfileId };
}
