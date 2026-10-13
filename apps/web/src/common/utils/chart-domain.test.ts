import { expect, test } from "vitest";
import { chartDomain } from "./chart-domain";

test("the range holds every value and the band with room on both sides", () => {
  const [low, high] = chartDomain([120, 90], { low: 70, high: 99 });
  expect(low).toBeLessThan(70);
  expect(high).toBeGreaterThan(120);
});

test("a band open at the bottom starts the range at zero", () => {
  expect(chartDomain([121, 143], { low: null, high: 99 })[0]).toBe(0);
});

test("a range of positive values never drops below zero", () => {
  expect(chartDomain([0.2, 5], null)[0]).toBe(0);
});

test("one flat value still gets a range around it", () => {
  const [low, high] = chartDomain([5, 5], null);
  expect(low).toBeLessThan(5);
  expect(high).toBeGreaterThan(5);
});
