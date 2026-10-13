import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { problem } from "../../common/problem.js";
import { validate } from "../../common/validate.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { createOrderSchema, orderParamsSchema } from "./payments.schemas.js";
import { createOrder, getOrder, handleWebhook, listPacks } from "./payments.service.js";

const paymentsEnabled = createMiddleware(async (c, next) => {
  if (!env.PAYMENTS_ENABLED) return problem(c, 404, "Not Found");
  await next();
});

/**
 * The payment provider's webhook, mounted before `auth` because the provider sends no user token.
 *
 * @remarks
 * The body is read as text first, because the signature covers the raw bytes and parsed JSON does not round-trip them.
 */
export const paymentsWebhookRoutes = new Hono().use(paymentsEnabled).post("/webhook", async (c) => {
  await handleWebhook(await c.req.text(), (name) => c.req.header(name));
  return c.json({ received: true });
});

export const paymentsRoutes = new Hono<AuthEnv>()
  .use(paymentsEnabled)
  .get("/packs", (c) => c.json(listPacks()))
  .post("/orders", validate("json", createOrderSchema), async (c) =>
    c.json(await createOrder(c.var.userId, c.var.email, c.req.valid("json").packId), 201),
  )
  .get("/orders/:id", validate("param", orderParamsSchema), async (c) =>
    c.json(await getOrder(c.var.userId, c.req.valid("param").id)),
  );
