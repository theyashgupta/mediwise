import type { TextLocale } from "@mediwise/engine";
import type { Context, Next } from "hono";
import { requestLocale } from "../common/locale.js";
import { problem } from "../common/problem.js";
import type { AuthEnv } from "./auth.js";

const hourMs = 60 * 60 * 1000;

type HourlyLimit<C extends Context> = {
  perHour: number;
  method: string;
  key: (c: C) => string;
  detail: Record<TextLocale, string>;
};

/**
 * Builds a middleware that lets each key make `perHour` requests per rolling hour and answers 429 after that.
 *
 * @remarks
 * ponytail: counts live in this process, move them to Postgres if the API runs more than one instance.
 */
function hourlyLimit<C extends Context>({ perHour, method, key, detail }: HourlyLimit<C>) {
  const seenAt = new Map<string, number[]>();
  return async (c: C, next: Next) => {
    if (c.req.method !== method) return next();
    const now = Date.now();
    const id = key(c);
    const recent = (seenAt.get(id) ?? []).filter((at) => at > now - hourMs);
    const oldest = recent[0];
    if (oldest !== undefined && recent.length >= perHour) {
      c.header("Retry-After", String(Math.ceil((oldest + hourMs - now) / 1000)));
      return problem(c, 429, "Too Many Requests", detail[requestLocale(c)]);
    }
    seenAt.set(id, [...recent, now]);
    await next();
  };
}

/**
 * Reads the client IP that Render puts first in `X-Forwarded-For`.
 *
 * @remarks
 * Render appends to a header the client sends, so a client can fake this value and skip the share limit. The share
 * token has 256 bits, so the limit slows scraping and is not what keeps a link secret.
 */
function clientIp(c: Context) {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Lets each user create 10 reports per rolling hour.
 *
 * @remarks
 * Every create costs a Claude call, so this caps spend per account.
 */
export const reportCreateLimit = hourlyLimit<Context<AuthEnv>>({
  perHour: 10,
  method: "POST",
  key: (c) => c.var.userId,
  detail: {
    en: "You can add 10 reports in one hour. Try again later.",
    hi: "आप एक घंटे में 10 रिपोर्ट जोड़ सकते हैं। बाद में फिर से कोशिश करें।",
  },
});

/** Lets each IP open 60 share links per rolling hour. */
export const shareViewLimit = hourlyLimit({
  perHour: 60,
  method: "GET",
  key: clientIp,
  detail: {
    en: "This link was opened too many times in one hour. Try again later.",
    hi: "यह लिंक एक घंटे में बहुत बार खोला गया। बाद में फिर से कोशिश करें।",
  },
});

const accountDetail = {
  en: "You can do this 5 times in one hour. Try again later.",
  hi: "आप यह एक घंटे में 5 बार कर सकते हैं। बाद में फिर से कोशिश करें।",
};

/** Lets each user delete the account 5 times per rolling hour. */
export const accountDeleteLimit = hourlyLimit<Context<AuthEnv>>({
  perHour: 5,
  method: "DELETE",
  key: (c) => c.var.userId,
  detail: accountDetail,
});

/** Lets each user export the account 5 times per rolling hour. */
export const accountExportLimit = hourlyLimit<Context<AuthEnv>>({
  perHour: 5,
  method: "GET",
  key: (c) => c.var.userId,
  detail: accountDetail,
});
