import type { TextLocale } from "@mediwise/engine";
import type { Context } from "hono";

/**
 * Reads the locale of the request from its `Accept-Language` header, English when it names no supported language.
 *
 * @remarks
 * The web sends the language the user picked, not the browser list, so the first tag decides.
 */
export function requestLocale(c: Context): TextLocale {
  return c.req.header("accept-language")?.trim().toLowerCase().startsWith("hi") ? "hi" : "en";
}
