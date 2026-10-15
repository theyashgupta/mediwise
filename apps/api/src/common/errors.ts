import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * An expected failure raised by a service, sent to the client as a problem response.
 *
 * @remarks
 * Services may not import Hono, so they throw this and `handleError` turns it into the HTTP response.
 */
export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
    readonly extensions?: Record<string, string>,
  ) {
    super(message);
  }
}
