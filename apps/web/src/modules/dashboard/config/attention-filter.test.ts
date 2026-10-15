import { describe, expect, test } from "vitest";
import type { AttentionItem } from "../types";
import { attentionFilters, matchesFilter } from "./attention-filter";

const marker = {
  kind: "marker",
  markerKey: "tsh",
  name: "Thyroid stimulating hormone",
  reportId: "r",
  date: "2026-09-15",
  value: 5.8,
  unit: "µIU/mL",
  precision: 2,
  previous: null,
} as const;
const worseningWatch: AttentionItem = {
  ...marker,
  group: "worsening",
  status: "watch",
  direction: "worsening",
};
const worseningRisk: AttentionItem = {
  ...marker,
  group: "risk",
  status: "risk",
  direction: "worsening",
};
const stableWatch: AttentionItem = {
  ...marker,
  group: "watch",
  status: "watch",
  direction: "stable",
};
const alert: AttentionItem = {
  kind: "alert",
  group: "risk",
  markerKey: null,
  name: 'Your ultrasound report says: "Grade II fatty liver."',
  title: 'Your ultrasound report says: "Grade II fatty liver."',
  reportId: "r",
  date: "2026-09-15",
};

function shown(filter: (typeof attentionFilters)[number]) {
  return [worseningWatch, worseningRisk, stableWatch, alert].filter((item) =>
    matchesFilter(item, filter),
  );
}

describe("matchesFilter", () => {
  test("all shows every row", () => {
    expect(shown("all")).toHaveLength(4);
  });

  test("worsening shows each worsening marker, whatever its status", () => {
    expect(shown("worsening")).toEqual([worseningWatch, worseningRisk]);
  });

  test("risk shows risk markers and study alerts", () => {
    expect(shown("risk")).toEqual([worseningRisk, alert]);
  });

  test("watch shows each watch marker, worsening or not", () => {
    expect(shown("watch")).toEqual([worseningWatch, stableWatch]);
  });
});
