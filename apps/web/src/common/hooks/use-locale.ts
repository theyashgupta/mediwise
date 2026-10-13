import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { defaultLocale, intlTag, isLocale, type Locale, messages } from "@/config/messages";
import { queryClient } from "@/config/query-client";
import { supabase } from "@/lib/supabase";

const storageKey = "locale";
const listeners = new Set<() => void>();
let current: Locale | undefined;

/**
 * Reads the stored locale, falling back to English.
 *
 * @remarks
 * Storage can throw in private windows, so a failure means the default.
 */
function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(storageKey);
    return isLocale(stored) ? stored : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/** The active locale, read once from storage. */
export function getLocale() {
  return (current ??= readLocale());
}

/**
 * Applies a locale on this device: storage, the `lang` attribute and every `useT` caller.
 *
 * @remarks
 * `index.html` sets `lang` from the same storage key before first paint. The API writes report text in the
 * locale, so a change refetches every query.
 */
function applyLocale(locale: Locale) {
  if (current !== undefined && current !== locale) void queryClient.invalidateQueries();
  current = locale;
  try {
    localStorage.setItem(storageKey, locale);
    // eslint-disable-next-line no-empty
  } catch {}
  document.documentElement.lang = locale;
  listeners.forEach((listener) => listener());
}

/**
 * Switches the language on this device and saves it to the account when signed in.
 *
 * @remarks
 * The account copy lives in Supabase `user_metadata`, so another device picks it up at sign-in without a migration.
 */
export async function setLocale(locale: Locale) {
  applyLocale(locale);
  const { data } = await supabase.auth.getSession();
  if (data.session && data.session.user.user_metadata.locale !== locale) {
    await supabase.auth.updateUser({ data: { locale } });
  }
}

/**
 * Reconciles this device with the account after sign-in.
 *
 * @remarks
 * The account choice wins when it exists. An account without one takes the choice made on this device, such as on the sign-in page.
 */
export async function syncLocale(session: Session) {
  const saved: unknown = session.user.user_metadata.locale;
  if (isLocale(saved)) {
    if (saved !== getLocale()) applyLocale(saved);
    return;
  }
  if (getLocale() !== defaultLocale)
    await supabase.auth.updateUser({ data: { locale: getLocale() } });
}

/**
 * Returns the active locale and re-renders the caller when it changes.
 */
export function useLocale() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getLocale,
    getLocale,
  );
}

/**
 * Returns the message tree of the active locale.
 */
export function useT() {
  return messages[useLocale()];
}

/**
 * Returns the message tree of the active locale outside React, such as in a toast or a schema.
 *
 * @remarks
 * Call it when the text is shown, not at module load, so a later switch takes effect.
 */
export function getT() {
  return messages[getLocale()];
}

/**
 * Returns the Intl tag of the active locale for date and number formatting.
 */
export function getIntlTag() {
  return intlTag(getLocale());
}
