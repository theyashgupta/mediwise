import { expect, test } from "vitest";
import { computeChange, verdictChange } from "./trends.service.js";

test("the change keeps the decimals of the stored values, whatever the display precision", () => {
  expect(computeChange(41.1, 47.3)).toEqual({ absolute: 6.2, percent: 15.1 });
  expect(computeChange(0, 2)).toEqual({ absolute: 2, percent: null });
});

test("a status the engine did not give counts as the same", () => {
  expect(verdictChange("unknown", "risk")).toBe("same");
  expect(verdictChange("risk", "watch")).toBe("improved");
});
