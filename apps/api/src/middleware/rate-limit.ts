import type { Context, Next } from "hono";
import { problem } from "../common/problem.js";
import type { AuthEnv } from "./auth.js";

const reportsPerHour = 10;
const hourMs = 60 * 60 * 1000;
const createdAt = new Map<string, number[]>();

/**
 * Lets each user create 10 reports per rolling hour and answers 429 after that.
 *
 * @remarks
 * Every create costs a Claude call, so this caps spend per account.
 * ponytail: counts live in this process, move them to Postgres if the API runs more than one instance.
 */
export async function reportCreateLimit(c: Context<AuthEnv>, next: Next) {
  if (c.req.method !== "POST") return next();
  const now = Date.now();
  const recent = (createdAt.get(c.var.userId) ?? []).filter((at) => at > now - hourMs);
  const oldest = recent[0];
  if (oldest !== undefined && recent.length >= reportsPerHour) {
    c.header("Retry-After", String(Math.ceil((oldest + hourMs - now) / 1000)));
    return problem(
      c,
      429,
      "Too Many Requests",
      `You can add ${reportsPerHour} reports in one hour. Try again later.`,
    );
  }
  createdAt.set(c.var.userId, [...recent, now]);
  await next();
}
