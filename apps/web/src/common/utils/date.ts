import { getIntlTag } from "@/common/hooks/use-locale";

/**
 * Formats a plain `YYYY-MM-DD` date for display.
 *
 * @remarks
 * Read in UTC, because a plain date parsed in a local zone west of UTC shows the day before.
 */
export function formatPlainDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString(getIntlTag(), { ...options, timeZone: "UTC" });
}
