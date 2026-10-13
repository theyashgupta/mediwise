import { expect, test } from "vitest";
import { scoreChange } from "./score-change";

test("a higher score reads as a signed gain in the optimal colour", () => {
  expect(scoreChange({ score: 4, since: "2025-02-01" }, "2025-05-18")).toEqual({
    value: "+4",
    since: "1 Feb",
    status: "optimal",
  });
});

test("a lower score from another year shows the year and the risk colour", () => {
  expect(scoreChange({ score: -21, since: "2024-01-13" }, "2025-05-18")).toEqual({
    value: "−21",
    since: "13 Jan 2024",
    status: "risk",
  });
});

test("no change reads as no change in a neutral colour", () => {
  expect(scoreChange({ score: 0, since: "2025-02-01" }, "2025-05-18").status).toBe("unknown");
});
