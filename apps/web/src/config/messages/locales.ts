export const locales = ["en", "hi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = { en: "English", hi: "हिन्दी" };

/**
 * Returns the BCP 47 tag for Intl date and number formatting.
 *
 * @remarks
 * `nu-latn` keeps Latin digits in Hindi, because lab reports print Latin digits.
 */
export function intlTag(locale: Locale) {
  return locale === "hi" ? "hi-IN-u-nu-latn" : "en-IN";
}

/**
 * Narrows an unknown stored value to a supported locale.
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
