import type { Marker } from "./schema.js";

const specimenPrefix = /^(serum|plasma|blood|s|sr) /;

/**
 * Normalises a lab's marker name for alias matching.
 *
 * @remarks
 * Only parentheses that hold a unit are dropped, because labs also use them for qualifiers such as "(Fasting)".
 * Accents are folded first, so "Urée" and "Uree" match one alias.
 */
export function normalizeName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\(([^)]*[/%][^)]*|fl|pg)\)/g, " ")
    .replace(/%/g, " percent ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function variants(raw: string): string[] {
  const names = [normalizeName(raw), normalizeName(raw.replace(/\([^)]*\)/g, " "))];
  return names.flatMap((name) => [name, name.replace(specimenPrefix, "").replace(/ percent$/, "")]);
}

/**
 * Builds a lookup from a raw lab name to a catalog entry by key, name, short name or alias.
 *
 * @remarks
 * A name like "HbA1c - Glycated Hemoglobin" falls back to its parts, and resolves only when every part
 * names the same marker, so a mixed name never maps to the wrong one.
 */
export function createMarkerFinder<T extends Marker>(
  entries: readonly T[],
): (rawName: string) => T | undefined {
  const index = new Map<string, T>();
  for (const entry of entries) {
    const terms = [
      entry.key.replace(/_/g, " "),
      entry.name,
      entry.shortName ?? "",
      ...entry.aliases,
    ];
    for (const term of terms) {
      const normalized = normalizeName(term);
      if (normalized && !index.has(normalized)) index.set(normalized, entry);
    }
  }

  const lookup = (raw: string) =>
    variants(raw)
      .map((name) => index.get(name))
      .find((entry) => entry !== undefined);

  return (rawName) => {
    const direct = lookup(rawName);
    if (direct) return direct;
    const parts = rawName.split(/[()]| - |:|,/).filter((part) => normalizeName(part));
    if (parts.length < 2) return undefined;
    const matches = parts.map(lookup);
    const first = matches[0];
    return first && matches.every((match) => match === first) ? first : undefined;
  };
}
