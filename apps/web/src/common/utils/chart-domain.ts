type Bounds = { low: number | null; high: number | null };

/**
 * Picks the y range of a value chart so every value and the optimal band fit with some room.
 *
 * @remarks
 * A band open at the bottom runs from zero, so it does not shrink to a strip.
 */
export function chartDomain(values: number[], band: Bounds | null): [number, number] {
  const floor = band && band.low === null && band.high !== null ? 0 : undefined;
  const finite = [...values, band?.low, band?.high, floor].filter((n): n is number =>
    Number.isFinite(n),
  );
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = max > min ? (max - min) * 0.15 : Math.abs(max) * 0.5 || 1;
  return [min >= 0 ? Math.max(0, min - pad) : min - pad, max + pad];
}
