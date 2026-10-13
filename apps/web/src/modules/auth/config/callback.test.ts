import { expect, test } from "vitest";
import { readCallback, safeNext } from "./callback";

const origin = "https://mediwise.pages.dev";

test("a target on this site keeps its path, search and hash", () => {
  expect(safeNext("/reports/r1?tab=all#ldl", origin)).toBe("/reports/r1?tab=all#ldl");
});

test("a missing target or a target on another site falls back to the dashboard", () => {
  expect(safeNext(undefined, origin)).toBe("/");
  expect(safeNext("https://evil.example.com/x", origin)).toBe("/");
  expect(safeNext("//evil.example.com/x", origin)).toBe("/");
});

test("a callback with a code and a target returns the target and no error", () => {
  expect(readCallback(new URL(`${origin}/auth/callback?code=abc&next=%2Ftrends`))).toEqual({
    error: undefined,
    next: "/trends",
  });
});

test("a cancel at Google returns access_denied even when Supabase adds its own code", () => {
  const url = new URL(
    `${origin}/auth/callback?error=access_denied&error_code=unexpected_failure&error_description=x`,
  );
  expect(readCallback(url).error).toBe("access_denied");
});

test("an error in the hash returns the Supabase error code", () => {
  const url = new URL(`${origin}/auth/callback#error=server_error&error_code=bad_oauth_state`);
  expect(readCallback(url).error).toBe("bad_oauth_state");
});
