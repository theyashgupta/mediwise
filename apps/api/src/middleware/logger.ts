import { tryGetContext } from "hono/context-storage";
import { logger } from "hono/logger";
import type { RequestIdVariables } from "hono/request-id";

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
 * Writes log lines for the whole API.
 *
 * @remarks
 * This is the only file allowed to call `console`, so a later switch to a structured logger touches one file.
 */
export const log = {
  info: (...args: unknown[]) => console.log(...withRequestId(args)),
  warn: (...args: unknown[]) => console.warn(...withRequestId(args)),
  error: (...args: unknown[]) => console.error(...withRequestId(args)),
};

export const requestLogger = logger((message, ...rest) => log.info(message, ...rest));
