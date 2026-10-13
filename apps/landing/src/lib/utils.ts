/**
 * Joins class names and drops empty ones.
 *
 * @remarks
 * The web app's `cn` package brings tailwind-merge, about 11 kB gzipped. The landing has no conflicting classes, so a join is enough.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
