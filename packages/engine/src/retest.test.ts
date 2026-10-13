import { expect, test } from "vitest";
import { retestDueDate } from "./retest.js";

test("a watch HbA1c from 1 Feb 2025 is due 31 Jan 2026", () => {
  expect(retestDueDate("hba1c", "watch", "2025-02-01")).toBe("2026-01-31");
});

test("a risk HbA1c is due 13 weeks after collection", () => {
  expect(retestDueDate("hba1c", "risk", "2025-02-01")).toBe("2025-05-03");
});

test("a derived eGFR at risk is due 52 weeks after collection", () => {
  expect(retestDueDate("egfr", "risk", "2024-02-29")).toBe("2025-02-27");
});

test("an optimal value gives no date", () => {
  expect(retestDueDate("hba1c", "optimal", "2025-02-01")).toBeUndefined();
});

test("a marker without a sourced interval gives no date", () => {
  expect(retestDueDate("ldl", "risk", "2025-02-01")).toBeUndefined();
});
