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
 * Returns the message of an error without the bound values of a failed query.
 *
 * @remarks
 * Drizzle puts every query param in the message of a failed query, and those params hold health text and ciphertext.
 * The SQL text and the database's own message stay, so the failure is still readable.
 */
export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return String(error);
  if (!("params" in error)) return error.message;
  const [query] = error.message.split("\nparams: ");
  return error.cause instanceof Error ? `${query}: ${error.cause.message}` : query!;
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
  const message = errorMessage(arg);
  const line = redact(`${arg.name}: ${message.slice(0, maxMessage)}`);
  const stack = (arg.stack ?? "").replace(arg.message, message);
  return env.NODE_ENV === "production" ? line : `${line}\n${redact(stack)}`;
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
