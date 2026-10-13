import { expect, test } from "vitest";
import { plural } from "./plural";

const forms = { one: "one", other: "other" };

test("English uses the singular form only for 1", () => {
  expect([0, 1, 2].map((n) => plural("en", n, forms))).toEqual(["other", "one", "other"]);
});

test("Hindi uses the singular form for 0 and 1", () => {
  expect([0, 1, 2].map((n) => plural("hi", n, forms))).toEqual(["one", "one", "other"]);
});
