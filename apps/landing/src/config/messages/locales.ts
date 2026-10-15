export const localePages = {
  en: { path: "/", lang: "en", ogLocale: "en_US", name: "English" },
  hi: { path: "/hi", lang: "hi-IN", ogLocale: "hi_IN", name: "हिन्दी" },
} as const;

export type Locale = keyof typeof localePages;

export const locales = Object.keys(localePages) as Locale[];
