import { tryGetContext } from "hono/context-storage";
import { logger } from "hono/logger";
import type { RequestIdVariables } from "hono/request-id";
import { env } from "../config/env.js";

const maxMessage = 500;

/**
 * Puts the request id in front of a log line written while a request is in flight.
 *
 * @remarks
 * Worker lines have no request, so they go out unchanged.
 */
function withRequestId(args: unknown[]) {
  const id = tryGetContext<{ Variables: RequestIdVariables }>()?.var.requestId;
  return id ? [`[${id}]`, ...args] : args;
}

/**
 * Masks secrets in one log argument and cuts an error down to its name and message.
 *
 * @remarks
 * The share token is the whole credential of a share link, so the path segment after `/share/` never reaches a log.
 * An error object can carry query values and report text, so production logs only its name and the first 500 characters of its message.
 */
export function redact(arg: unknown): unknown {
  if (typeof arg === "string") return arg.replace(/(\/share\/)[^/\s?#]+/g, "$1***");
  if (!(arg instanceof Error)) return arg;
  const line = redact(`${arg.name}: ${arg.message.slice(0, maxMessage)}`);
  return env.NODE_ENV === "production" ? line : `${line}\n${redact(arg.stack ?? "")}`;
}

const prepare = (args: unknown[]) => withRequestId(args.map(redact));

/**
 * Writes log lines for the whole API.
 *
 * @remarks
 * This is the only file allowed to call `console`, so a later switch to a structured logger touches one file.
 */
export const log = {
  info: (...args: unknown[]) => console.log(...prepare(args)),
  warn: (...args: unknown[]) => console.warn(...prepare(args)),
  error: (...args: unknown[]) => console.error(...prepare(args)),
};

export const requestLogger = logger((message, ...rest) => log.info(message, ...rest));
