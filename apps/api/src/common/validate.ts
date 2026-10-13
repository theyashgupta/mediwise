import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { problem } from "./problem.js";

/**
 * Validates one part of the request with a zod schema.
 *
 * @remarks
 * Built on `hono/validator` so no extra adapter package is needed. A failure answers 400 with a problem body.
 */
export function validate<T extends keyof ValidationTargets, S extends z.ZodType>(
  target: T,
  schema: S,
) {
  return validator(target, async (value, c) => {
    const result = await schema.safeParseAsync(value);
    if (!result.success) {
      return problem(c, 400, "Invalid request", z.prettifyError(result.error));
    }
    return result.data as z.output<S>;
  });
}
