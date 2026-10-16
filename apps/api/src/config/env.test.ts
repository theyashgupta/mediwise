import { expect, test } from "vitest";
import { dataKeySchema, parseOrigins } from "./env.js";

test("an origin list splits on commas and drops spaces, empty entries and trailing slashes", () => {
  expect(
    parseOrigins(" https://app.mediwise.theyashgupta.me/ ,,https://mediwise.pages.dev "),
  ).toEqual(["https://app.mediwise.theyashgupta.me", "https://mediwise.pages.dev"]);
});

test("one origin with a port parses to itself", () => {
  expect(parseOrigins("http://localhost:5173")).toEqual(["http://localhost:5173"]);
});

test("an entry that is not a URL fails at startup", () => {
  expect(() => parseOrigins("https://mediwise.pages.dev,mediwise.theyashgupta.me")).toThrow();
});

test("an empty list fails at startup", () => {
  expect(() => parseOrigins(" , ")).toThrow();
});

test("a data key of 32 bytes in base64 passes", () => {
  expect(dataKeySchema.safeParse(Buffer.alloc(32, 1).toString("base64")).success).toBe(true);
});

test.each([
  ["16 bytes", Buffer.alloc(16, 1).toString("base64")],
  ["33 bytes", Buffer.alloc(33, 1).toString("base64")],
  ["not base64", "not a key at all!"],
  ["empty", ""],
])("a data key of %s fails at startup without its value in the error", (_, value) => {
  const result = dataKeySchema.safeParse(value);
  expect(result.success).toBe(false);
  if (value) expect(JSON.stringify(result.error)).not.toContain(value);
});
