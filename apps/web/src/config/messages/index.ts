import { en } from "./en";
import { hi } from "./hi";
import type { Locale } from "./locales";

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = { en, hi };

export { defaultLocale, intlTag, isLocale, localeNames, locales, type Locale } from "./locales";
export { plural } from "./plural";
