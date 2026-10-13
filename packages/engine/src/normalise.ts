import { derived, findMarker, markers, type Marker, studyMarkers } from "./catalog/index.js";
import type { EngineValue, LabRange, UnmappedValue } from "./types.js";

export type Normalised = {
  entry: Marker;
  value: number | string;
  unit: string;
  canonical: boolean;
  labRange?: LabRange;
};

const entriesByKey = new Map<string, Marker>(
  [...markers, ...derived, ...studyMarkers].map((e) => [e.key, e]),
);
const unitlessUnits = new Set(["ratio", "grade", "pH", "index"]);

export function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Folds a unit's spelling so "gm/dl", "μIU/ml" and "g/dL" compare by meaning.
 *
 * @remarks
 * Only spelling is folded. Two units with different meanings never become equal, so a wrong conversion is impossible.
 */
export function normaliseUnit(unit: string): string {
  return unit
    .toLowerCase()
    .replace(/[µμ]/g, "u")
    .replace(/mcg/g, "ug")
    .replace(/gms?(?=\/|$)/g, "g")
    .replace(/³/g, "^3")
    .replace(/²|\^2/g, "2")
    .replace(/\s+/g, "")
    .replace(/\/lt$/, "/l");
}

/**
 * Converts a value to the marker's canonical unit, or returns `undefined` for a unit the catalog does not list.
 *
 * @remarks
 * A missing unit counts as canonical only for unitless markers such as ratios and urine grades. Anywhere else it is a guess.
 */
export function toCanonical(entry: Marker, value: number, unit?: string): number | undefined {
  if (!unit) return unitlessUnits.has(entry.unit) ? value : undefined;
  const key = normaliseUnit(unit);
  if (key === normaliseUnit(entry.unit)) return value;
  const conversion = entry.conversions.find((c) => normaliseUnit(c.from) === key);
  if (!conversion) return undefined;
  return round(value * conversion.factor + (conversion.offset ?? 0), entry.precision);
}

function convertLabBound(entry: Marker, bound: number | undefined, unit?: string): number | null {
  return bound === undefined ? null : (toCanonical(entry, bound, unit) ?? null);
}

/**
 * Maps each extracted value to a catalog entry and converts it to the canonical unit.
 *
 * @remarks
 * The first value for a marker wins and later repeats are dropped, because labs often echo a value in a summary table.
 * A repeat in a unit the catalog converts replaces a first value it cannot convert, so a misprinted unit loses no status.
 */
export function normaliseValues(values: EngineValue[]): {
  normalised: Normalised[];
  unmapped: UnmappedValue[];
} {
  const normalised: Normalised[] = [];
  const unmapped: UnmappedValue[] = [];
  const seen = new Map<string, number>();
  for (const input of values) {
    const entry =
      (input.markerKey && entriesByKey.get(input.markerKey)) ||
      findMarker(input.rawName, input.panel, input.value);
    if (!entry) {
      unmapped.push({ rawName: input.rawName, value: input.value, unit: input.unit ?? "" });
      continue;
    }
    const value =
      typeof input.value === "number" ? toCanonical(entry, input.value, input.unit) : undefined;
    const earlier = seen.get(entry.key);
    if (earlier !== undefined && (value === undefined || normalised[earlier]!.canonical)) continue;
    const hasLabRange = input.labLow !== undefined || input.labHigh !== undefined;
    const item: Normalised =
      value === undefined
        ? {
            entry,
            value: input.value,
            unit: input.unit ?? "",
            canonical: false,
            ...(hasLabRange && {
              labRange: { low: input.labLow ?? null, high: input.labHigh ?? null },
            }),
          }
        : {
            entry,
            value,
            unit: entry.unit,
            canonical: true,
            ...(hasLabRange && {
              labRange: {
                low: convertLabBound(entry, input.labLow, input.unit),
                high: convertLabBound(entry, input.labHigh, input.unit),
              },
            }),
          };
    if (earlier === undefined) {
      seen.set(entry.key, normalised.length);
      normalised.push(item);
    } else {
      normalised[earlier] = item;
    }
  }
  return { normalised, unmapped };
}
