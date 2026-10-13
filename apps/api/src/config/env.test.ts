import { expect, test } from "vitest";
import { parseOrigins } from "./env.js";

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
