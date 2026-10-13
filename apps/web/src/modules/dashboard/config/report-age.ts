const dayMs = 86_400_000;

/**
 * Tells whether a report date is more than 365 days before today.
 *
 * @remarks
 * Today is the reader's local calendar day, compared with the plain report date as whole UTC days.
 */
export function isOlderThanAYear(date: string, today: Date) {
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return (todayUtc - Date.parse(date)) / dayMs > 365;
}
