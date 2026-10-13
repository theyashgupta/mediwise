export type OklchColor = {
  colorSpace: "oklch";
  components: [number, number, number];
  alpha?: number;
};

export type Rgb = [number, number, number];

/**
 * Converts an OKLCH colour to gamma-encoded sRGB channels from 0 to 1.
 *
 * @remarks
 * Uses the OKLab to linear sRGB matrices from the CSS Color 4 spec, clamped to the sRGB gamut.
 */
export function toSrgb({ components: [l, c, h] }: OklchColor): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lo = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mo = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const so = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * lo - 3.3077115913 * mo + 0.2309699292 * so,
    -1.2684380046 * lo + 2.6097574011 * mo - 0.3413193965 * so,
    -0.0041960863 * lo - 0.7034186147 * mo + 1.707614701 * so,
  ];
  const [red = 0, green = 0, blue = 0] = linear.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  });
  return [red, green, blue];
}

/**
 * Returns the WCAG relative luminance of gamma-encoded sRGB channels.
 */
export function luminance(rgb: Rgb) {
  const [r = 0, g = 0, b = 0] = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(x: Rgb, y: Rgb) {
  const [p, q] = [luminance(x), luminance(y)];
  return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05);
}

/**
 * Blends a translucent colour over an opaque backdrop.
 *
 * @remarks
 * Browsers composite in gamma-encoded sRGB, so the blend is linear in those channels.
 */
export function composite(color: OklchColor, backdrop: Rgb): Rgb {
  const alpha = color.alpha ?? 1;
  const top = toSrgb(color);
  return [0, 1, 2].map((i) => alpha * top[i]! + (1 - alpha) * backdrop[i]!) as Rgb;
}

export function toCssColor({ components: [l, c, h], alpha }: OklchColor) {
  const base = `${l} ${c} ${h}`;
  return alpha === undefined ? `oklch(${base})` : `oklch(${base} / ${+(alpha * 100).toFixed(2)}%)`;
}

/**
 * Formats a colour for React Native, which reads hex and rgba() but not oklch().
 */
export function toNativeColor(color: OklchColor) {
  const channels = toSrgb(color).map((v) => Math.round(v * 255));
  if (color.alpha === undefined) {
    return `#${channels.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  }
  return `rgba(${channels.join(", ")}, ${color.alpha})`;
}
