import type { Locale } from "./locales";

/**
 * Picks the singular or plural form for a count.
 *
 * @remarks
 * Intl.PluralRules knows that Hindi uses the "one" form for 0 and 1, so no ICU message syntax is needed.
 */
export function plural(locale: Locale, count: number, forms: { one: string; other: string }) {
  return new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
}
