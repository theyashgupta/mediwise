import { expect, test } from "vitest";
import { formatCents, formatWait } from "./admin";

test("cents show as dollars with four decimals under one dollar", () => {
  expect(formatCents(0.18)).toBe("$0.0018");
  expect(formatCents(1650)).toBe("$16.50");
});

test("a wait shows minutes, then hours and minutes past one hour", () => {
  expect(formatWait(45 * 60_000 + 30_000)).toBe("45 min");
  expect(formatWait(135 * 60_000)).toBe("2 h 15 min");
});
