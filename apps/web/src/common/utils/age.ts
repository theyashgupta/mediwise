/**
 * Whole years between an ISO date of birth and `today`.
 *
 * @remarks
 * Compares month and day instead of timestamps, so time zones cannot shift the date. A 29 February birthday counts from 1 March in common years.
 */
export function ageOn(dateOfBirth: string, today = new Date()) {
  const [year = 0, month = 0, day = 0] = dateOfBirth.split("-").map(Number);
  const todayMonth = today.getMonth() + 1;
  const hadBirthday = todayMonth > month || (todayMonth === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}
