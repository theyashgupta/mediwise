import { useSyncExternalStore } from "react";
import { useProfiles } from "./use-profiles";

const storageKey = "activeProfileId";
const listeners = new Set<() => void>();
let current: string | null | undefined;

/**
 * Reads the stored active profile id.
 *
 * @remarks
 * Storage can throw in private windows, so a failure means "no choice yet".
 */
function readStoredId() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function setActiveProfileId(id: string) {
  current = id;
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
  const storedId = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (current ??= readStoredId()),
  );
  const list = profiles.data ?? [];
  const profile = list.find((p) => p.id === storedId) ?? list.find((p) => p.isSelf);
  return { profile, profiles: list, setActiveProfileId };
}
