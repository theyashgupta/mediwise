import { expect, test } from "vitest";
import { formatCreditChange, formatCredits } from "./admin";

test("a credit change shows its sign, and a credit total shows its unit", () => {
  expect(formatCreditChange(5)).toBe("+5");
  expect(formatCreditChange(-1)).toBe("-1");
  expect(formatCredits(-1)).toBe("1 credit");
  expect(formatCredits(25)).toBe("25 credits");
});
