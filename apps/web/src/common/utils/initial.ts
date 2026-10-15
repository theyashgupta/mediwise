const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * Returns the avatar initial of a name: its first grapheme that starts with a letter.
 *
 * @remarks
 * `charAt(0)` returns half of an emoji, which renders as a box. A name with no letter keeps its first whole grapheme.
 */
export function initial(name: string) {
  const all = [...graphemes.segment(name)].map(({ segment }) => segment);
  return all.find((segment) => /^\p{L}/u.test(segment)) ?? all[0] ?? "";
}
