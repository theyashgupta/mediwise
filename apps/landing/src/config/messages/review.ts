/**
 * Flags a Hindi string for the reviewer and returns it unchanged.
 *
 * @remarks
 * A call is greppable and survives formatting, so `grep -c "review("` counts the open items.
 */
export function review(text: string) {
  return text;
}
