import { getIntlTag } from "@/common/hooks/use-locale";

const formats = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a date in the app locale.
 *
 * @remarks
 * One formatter per locale and options is kept, because `toLocaleDateString` builds a new one on each call, which
 * slows a long list and a tab tap.
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  const tag = getIntlTag();
  const key = `${tag} ${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(tag, options);
    formats.set(key, format);
  }
  return format.format(date);
}

/**
 * Formats a plain `YYYY-MM-DD` date for display.
 *
 * @remarks
 * Read in UTC, because a plain date parsed in a local zone west of UTC shows the day before.
 */
export function formatPlainDate(date: string, options: Intl.DateTimeFormatOptions) {
  return formatDate(new Date(date), { ...options, timeZone: "UTC" });
}
