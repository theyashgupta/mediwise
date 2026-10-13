import { expect, test } from "vitest";
import { creditsLeftLabel, validateCreditsSearch } from "./credits";

test("the label counts reports left, in the singular for one", () => {
  expect(creditsLeftLabel(3)).toBe("3 reports left");
  expect(creditsLeftLabel(1)).toBe("1 report left");
  expect(creditsLeftLabel(0)).toBe("0 reports left");
});

test("the credits search keeps an order id only when it is a UUID", () => {
  const id = "6f1c2d3e-4b5a-4c6d-8e7f-901234567890";
  expect(validateCreditsSearch({ order: id })).toEqual({ order: id });
  expect(validateCreditsSearch({ order: "<script>" })).toEqual({});
  expect(validateCreditsSearch({})).toEqual({});
});
