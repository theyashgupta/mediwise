import { DrizzleQueryError } from "drizzle-orm/errors";
import { Hono } from "hono";
import { afterEach, expect, test, vi } from "vitest";
import { env } from "../config/env.js";
import { errorMessage, log, requestLogger } from "./logger.js";

afterEach(() => {
  vi.restoreAllMocks();
  env.NODE_ENV = "test";
});

function captured(method: "log" | "error") {
  const lines: string[] = [];
  vi.spyOn(console, method).mockImplementation((...args) => lines.push(args.join(" ")));
  return lines;
}

test("the request lines for GET /share/abc carry no share token", async () => {
  const lines = captured("log");
  const app = new Hono().use(requestLogger).get("/share/:token", (c) => c.text("ok"));
  await app.request("/share/abc");
  expect(lines).toHaveLength(2);
  for (const line of lines) {
    expect(line).toContain("/share/***");
    expect(line).not.toContain("abc");
  }
});

test("an error in production logs its name and the first 500 characters of its message, without the stack", () => {
  env.NODE_ENV = "production";
  const lines = captured("error");
  log.error(new TypeError(`${"x".repeat(600)} at /share/secret-token`));
  expect(lines).toEqual([`TypeError: ${"x".repeat(500)}`]);
});

test("an error outside production keeps its stack for debugging", () => {
  const lines = captured("error");
  log.error(new Error("boom"));
  expect(lines[0]).toMatch(/^Error: boom\n[\s\S]*logger\.test\.ts/);
});

test("a failed query logs its SQL and the database message, never its params", () => {
  const error = new DrizzleQueryError(
    'update "profiles" set "name" = $1',
    ["v1:abc:secret-ciphertext", "Asha Rao"],
    new Error("value too long"),
  );
  for (const nodeEnv of ["production", "test"] as const) {
    env.NODE_ENV = nodeEnv;
    const lines = captured("error");
    log.error(error);
    expect(lines[0]).toMatch(
      /^Error: Failed query: update "profiles" set "name" = \$1: value too long/,
    );
    expect(lines[0]).not.toContain("secret-ciphertext");
    expect(lines[0]).not.toContain("Asha Rao");
    vi.restoreAllMocks();
  }
  expect(errorMessage(error)).toBe(
    'Failed query: update "profiles" set "name" = $1: value too long',
  );
});
