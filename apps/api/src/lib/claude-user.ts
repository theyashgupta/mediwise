import type Anthropic from "@anthropic-ai/sdk";
import { tryGetContext } from "hono/context-storage";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac } from "node:crypto";
import { env } from "../config/env.js";
import type { AuthEnv } from "../middleware/auth.js";

/** Holds the user a worker job reads for, since the worker runs outside a request. */
export const claudeUser = new AsyncLocalStorage<string>();

/**
 * Names the user of a Claude call to Anthropic as an HMAC-SHA256 of the user id, keyed with `ANTHROPIC_USER_SALT`.
 *
 * @remarks
 * Anthropic ties abuse signals to `user_id`, so a raw id never leaves the API. Without the salt the call carries no
 * user, because an unsalted hash of a known id can be reversed by hashing every id.
 */
export function claudeMetadata(): Anthropic.Metadata | undefined {
  const userId = claudeUser.getStore() ?? tryGetContext<AuthEnv>()?.var.userId;
  if (!userId || !env.ANTHROPIC_USER_SALT) return undefined;
  return { user_id: createHmac("sha256", env.ANTHROPIC_USER_SALT).update(userId).digest("hex") };
}
