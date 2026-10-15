import type { Context, ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { log } from "../middleware/logger.js";
import { AppError } from "./errors.js";

/** Sends an RFC 9457 problem details response. Every error response in the API goes through here. */
export function problem<S extends ContentfulStatusCode>(
  c: Context,
  status: S,
  title: string,
  detail?: string,
  extensions?: Record<string, string>,
) {
  return c.json(
    { ...extensions, type: "about:blank", title, status, ...(detail && { detail }) },
    status,
    {
      "Content-Type": "application/problem+json",
    },
  );
}

/**
 * Maps a thrown error to a problem response.
 *
 * @remarks
 * Unknown errors are logged and answered with a bare 500 so internals never reach the client.
 */
export const handleError: ErrorHandler = (err, c) => {
  if (err instanceof AppError)
    return problem(c, err.status, err.message, undefined, err.extensions);
  if (err instanceof HTTPException) return problem(c, err.status, err.message);
  log.error(err);
  return problem(c, 500, "Internal Server Error");
};
