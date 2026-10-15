import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { createHmac } from "node:crypto";
import { afterEach, expect, test } from "vitest";
import { env } from "../config/env.js";
import type { AuthEnv } from "../middleware/auth.js";
import { claudeMetadata } from "./claude-user.js";

const salt = "test-salt-0123456789";

afterEach(() => {
  env.ANTHROPIC_USER_SALT = undefined;
});

/** Runs `claudeMetadata` inside a request signed in as `user-1`. */
async function metadataInRequest() {
  const app = new Hono<AuthEnv>()
    .use(contextStorage())
    .use(async (c, next) => {
      c.set("userId", "user-1");
      await next();
    })
    .get("/", (c) => c.json(claudeMetadata() ?? null));
  return (await app.request("/")).json();
}

test("a Claude call made during a request names the user by the salted hash of the id", async () => {
  env.ANTHROPIC_USER_SALT = salt;
  expect(await metadataInRequest()).toEqual({
    user_id: createHmac("sha256", salt).update("user-1").digest("hex"),
  });
});

test("without a salt a Claude call names no user", async () => {
  expect(await metadataInRequest()).toBeNull();
});
