import { Hono } from "hono";
import { testClient } from "hono/testing";
import { expect, test } from "vitest";
import { z } from "zod";
import { validate } from "./validate.js";

const app = new Hono().post("/", validate("json", z.object({ name: z.string() })), (c) =>
  c.json(c.req.valid("json")),
);

test("validate passes the parsed body to the handler", async () => {
  const res = await testClient(app).index.$post({ json: { name: "Asha" } });
  expect(await res.json()).toEqual({ name: "Asha" });
});

test("validate answers an invalid body with a 400 problem", async () => {
  const res = await app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: 1 }),
  });
  expect(res.status).toBe(400);
  expect(res.headers.get("Content-Type")).toBe("application/problem+json");
  expect(await res.json()).toMatchObject({ status: 400, title: "Invalid request" });
});
