import { getT } from "@/common/hooks/use-locale";

export type Range = { low?: number; high?: number };

export type Band = { from: number; to: number };

/**
 * Maps a value and its ranges onto 0 to 100 percent positions for a shared bar.
 *
 * @remarks
 * Lab ranges are often open-ended ("below 200"), so a missing bound runs the band to the bar's edge.
 * The domain starts at zero for non-negative data because lab values below zero do not exist.
 */
export function rangeScale(value: number, lab?: Range, calibrated?: Range, watch?: Range) {
  const points = [
    value,
    lab?.low,
    lab?.high,
    calibrated?.low,
    calibrated?.high,
    watch?.low,
    watch?.high,
  ].filter((n): n is number => Number.isFinite(n));
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = max > min ? (max - min) * 0.2 : Math.abs(max) * 0.5 || 1;
  const lo = min >= 0 ? Math.max(0, min - pad) : min - pad;
  const hi = max + pad;
  const pct = (n: number) => Math.min(100, Math.max(0, ((n - lo) / (hi - lo)) * 100));
  const band = (range?: Range): Band | null =>
    range && (range.low !== undefined || range.high !== undefined)
      ? { from: pct(range.low ?? lo), to: pct(range.high ?? hi) }
      : null;

  return {
    value: pct(value),
    pct,
    lab: band(lab),
    calibrated: band(calibrated),
    watch: band(watch),
  };
}

/**
 * Formats a range in words, so open-ended lab ranges read naturally.
 */
export function formatRange({ low, high }: Range, unit?: string) {
  const { range } = getT().common;
  const text =
    low !== undefined && high !== undefined
      ? range.between(low, high)
      : high !== undefined
        ? range.below(high)
        : range.above(low ?? 0);
  return unit ? `${text} ${unit}` : text;
}
