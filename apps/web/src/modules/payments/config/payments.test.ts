import { expect, test } from "vitest";
import { formatRupees } from "./payments";

test("an amount in paise shows as rupees, with paise only when there are some", () => {
  expect(formatRupees(19900)).toBe("₹199");
  expect(formatRupees(59900)).toBe("₹599");
  expect(formatRupees(4950)).toBe("₹49.50");
});
