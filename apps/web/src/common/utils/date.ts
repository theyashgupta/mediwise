import { getIntlTag } from "@/common/hooks/use-locale";

const formats = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a plain `YYYY-MM-DD` date for display.
 *
 * @remarks
 * Read in UTC, because a plain date parsed in a local zone west of UTC shows the day before.
 * One formatter per locale and options is kept, because building one per row slows a long list.
 */
export function formatPlainDate(date: string, options: Intl.DateTimeFormatOptions) {
  const tag = getIntlTag();
  const key = `${tag} ${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(tag, { ...options, timeZone: "UTC" });
    formats.set(key, format);
  }
  return format.format(new Date(date));
}
