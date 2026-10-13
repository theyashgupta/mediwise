import { categories, derived, markers, patterns, sources, type Category } from "@mediwise/engine";
import { maxFileBytes, maxFiles, maxProfilesPerUser, maxTotalBytes } from "@mediwise/shared";
import { paymentPacks } from "../../../api/src/modules/payments/payments.config";

/**
 * Writes an amount in paise as rupees, with paise only when the amount has them.
 */
export function rupees(paise: number) {
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: whole ? 0 : 2 })}`;
}

const megabytes = (bytes: number) => bytes / 1024 / 1024;

export const packs = paymentPacks.map((pack) => ({
  ...pack,
  price: rupees(pack.amount),
  perReport: rupees(Math.round(pack.amount / pack.credits)),
}));

const [firstPack] = packs;
const cheapest = packs.reduce((best, pack) =>
  pack.amount / pack.credits < best.amount / best.credits ? pack : best,
);
if (!firstPack) throw new Error("payments.config.ts has no pack");

export const facts = {
  markers: markers.length,
  derived: derived.length,
  patterns: patterns.length,
  sources: Object.keys(sources).length,
  maxFiles,
  maxFileMb: megabytes(maxFileBytes),
  maxTotalMb: megabytes(maxTotalBytes),
  maxProfiles: maxProfilesPerUser,
  firstPack,
  cheapest,
  cheapestPaise: Math.round(cheapest.amount / cheapest.credits),
};

const marqueeCategories: Category[][] = [
  ["metabolic", "lipids", "cardiac", "inflammation", "liver", "kidney", "thyroid"],
  ["vitamins", "iron", "blood_count", "electrolytes", "bone", "urate", "hormones"],
];

/**
 * Picks up to five short marker names per category for the two marquee rows.
 *
 * @remarks
 * The names come from the engine catalog, so the marquee never shows a marker MediWise does not know.
 */
export function marqueeRows() {
  const all = [...markers, ...derived];
  return marqueeCategories.map((row) =>
    row.map((category, index) => ({
      category,
      label: categories.find(({ key }) => key === category)?.label ?? category,
      colour: index % 5,
      names: all
        .filter((marker) => marker.category === category)
        .map((marker) =>
          marker.name.length <= 18 ? marker.name : (marker.shortName ?? marker.name),
        )
        .filter((name) => name.length <= 18)
        .slice(0, 5),
    })),
  );
}
