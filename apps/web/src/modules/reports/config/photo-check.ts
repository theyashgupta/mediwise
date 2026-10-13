export type PhotoFlags = { small: boolean; dark: boolean; blurred: boolean };

const checkSide = 512;
const minShortSide = 1000;
const darkMean = 255 * 0.25;
const blurThreshold = 200;

/** Returns the size of the photo copy the check reads: 512 px on the long side, never larger than the photo. */
export function checkSize(width: number, height: number) {
  const scale = Math.min(1, checkSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Flags a photo that may read badly: small, dark or blurred.
 *
 * @remarks
 * `width` and `height` are the size of the original photo, and `grey` holds one 0 to 255 value per pixel of
 * the {@link checkSize} copy, row by row. Sample report pages score 2,198 or more sharp and 165 or less after an
 * 8 px blur, so blurred is under 200. A dark photo is never blurred, because low light cuts the score of a sharp page.
 */
export function photoFlags(width: number, height: number, grey: ArrayLike<number>): PhotoFlags {
  const size = checkSize(width, height);
  let sum = 0;
  for (let i = 0; i < grey.length; i++) sum += grey[i] ?? 0;
  const dark = (grey.length ? sum / grey.length : 0) < darkMean;
  return {
    small: Math.min(width, height) < minShortSide,
    dark,
    blurred: !dark && laplacianVariance(size.width, size.height, grey) < blurThreshold,
  };
}

/** Returns one warning per flag, in a fixed order: small, dark, blurred. */
export function photoWarnings(flags: PhotoFlags | undefined) {
  if (!flags) return [];
  return [
    flags.small && "This photo is small. Take it again closer to the page.",
    flags.dark && "This photo is dark. Take it again in good light.",
    flags.blurred && "This photo is blurred. Hold the phone still and take it again.",
  ].filter((warning) => warning !== false);
}

/** Returns the variance of the 4-neighbour Laplacian over the inner pixels of a grey image. */
export function laplacianVariance(width: number, height: number, grey: ArrayLike<number>) {
  const at = (x: number, y: number) => grey[y * width + x] ?? 0;
  let sum = 0;
  let squares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const value = at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1) - 4 * at(x, y);
      sum += value;
      squares += value * value;
      count++;
    }
  }
  return count ? squares / count - (sum / count) ** 2 : 0;
}
