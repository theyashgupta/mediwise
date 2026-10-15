export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = { en: "English", hi: "हिन्दी" };

/**
 * Returns the BCP 47 tag for Intl date and number formatting.
 *
 * @remarks
 * English follows the browser's English variant, so an en-GB reader sees "16 October" and an en-US reader "October 16".
 * A browser in another language gets en-US, so a date never mixes English copy with foreign month names.
 * `nu-latn` keeps Latin digits in Hindi, because lab reports print Latin digits.
 */
export function intlTag(locale: Locale) {
  if (locale === "hi") return "hi-IN-u-nu-latn";
  const browser = globalThis.navigator?.language;
  return browser && /^en\b/i.test(browser) ? browser : "en-US";
}

/** Formats a count with the locale's digit grouping, for example 1,284 or 1,23,640 for en-IN. */
export function formatCount(locale: Locale, count: number) {
  return new Intl.NumberFormat(intlTag(locale)).format(count);
}

/**
 * Narrows an unknown stored value to a supported locale.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
