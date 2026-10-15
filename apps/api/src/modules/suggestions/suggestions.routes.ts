import { Hono } from "hono";
import { etag } from "hono/etag";
import { requestLocale } from "../../common/locale.js";
import { validate } from "../../common/validate.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { suggestionsParamsSchema } from "./suggestions.schemas.js";
import { getSuggestions } from "./suggestions.service.js";

export const suggestionsRoutes = new Hono<AuthEnv>().get(
  "/:id/suggestions",
  etag(),
  validate("param", suggestionsParamsSchema),
  async (c) => {
    c.header("Cache-Control", "private, no-cache");
    c.header("Vary", "Accept-Language", { append: true });
    return c.json(await getSuggestions(c.var.userId, c.req.valid("param").id, requestLocale(c)));
  },
);
