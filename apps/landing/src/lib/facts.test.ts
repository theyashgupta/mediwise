import { derived, markers, repeatStudyDays } from "@mediwise/engine";
import { maxFiles } from "@mediwise/shared";
import { expect, test } from "vitest";
import { paymentPacks } from "../../../api/src/modules/payments/payments.config";
import { facts, marqueeRows, packs, rupees } from "./facts";

test("rupees writes paise only when the amount has them", () => {
  expect(rupees(4900)).toBe("₹49");
  expect(rupees(2995)).toBe("₹29.95");
  expect(rupees(129900)).toBe("₹1,299");
});

test("every price on the page comes from payments.config.ts", () => {
  expect(packs.map(({ id, amount }) => ({ id, amount }))).toEqual(
    paymentPacks.map(({ id, amount }) => ({ id, amount })),
  );
  const lowest = Math.min(...paymentPacks.map((pack) => pack.amount / pack.credits));
  expect(facts.cheapestPaise).toBe(Math.round(lowest));
  expect(facts.firstPack.amount).toBe(paymentPacks[0].amount);
});

test("the counts on the page are the catalog's own counts", () => {
  expect(facts.markers).toBe(markers.length);
  expect(facts.maxFiles).toBe(maxFiles);
  expect(facts.repeatStudyDays).toBe(repeatStudyDays);
});

test("the marquee shows only marker names from the catalog", () => {
  const known = new Set(
    [...markers, ...derived].flatMap((marker) => [marker.name, marker.shortName]),
  );
  const names = marqueeRows("en")
    .flat()
    .flatMap((group) => group.names);
  expect(names.length).toBeGreaterThan(40);
  expect(names.filter((name) => !known.has(name))).toEqual([]);
});
