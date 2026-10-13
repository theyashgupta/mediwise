import { z } from "zod";

const problemSchema = z.object({ title: z.string(), detail: z.string().optional() });

export class ProblemError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Builds an Error from a failed API response, with the problem title and detail as its message.
 *
 * @remarks
 * A 500, or a 5xx without a problem body, gets one plain message, because it tells the user nothing they can act on.
 * Other 5xx problems, such as the 503 for paused uploads, carry a message the API wrote for the user.
 */
export async function problemError(res: { status: number; json(): Promise<unknown> }) {
  const parsed = problemSchema.safeParse(await res.json().catch(() => undefined));
  if (res.status >= 500 && (res.status === 500 || !parsed.success)) {
    return new ProblemError(
      "We could not complete this request. Try again in a few minutes.",
      res.status,
    );
  }
  if (!parsed.success)
    return new ProblemError(`Something went wrong (HTTP ${res.status})`, res.status);
  return new ProblemError(
    [parsed.data.title, parsed.data.detail].filter(Boolean).join(". "),
    res.status,
  );
}
