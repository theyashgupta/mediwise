import { Hono } from "hono";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterAll, expect, test, vi } from "vitest";
import { auth } from "./auth.js";

vi.hoisted(() => {
  process.env.NODE_ENV = "production";
});

afterAll(() => {
  process.env.NODE_ENV = "test";
});

const app = new Hono()
  .use(auth)
  .get("/", (c) => c.json({ userId: c.var.userId, email: c.var.email, name: c.var.name }));

const issuer = "http://localhost:54321/auth/v1";

function sign(
  claims: { aud?: string; iss?: string; exp?: string; user_metadata?: object } = {},
  secret = process.env.SUPABASE_JWT_SECRET,
) {
  return new SignJWT({ email: "arjun@example.com", user_metadata: claims.user_metadata })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user-1")
    .setAudience(claims.aud ?? "authenticated")
    .setIssuer(claims.iss ?? issuer)
    .setExpirationTime(claims.exp ?? "1h")
    .sign(new TextEncoder().encode(secret));
}

function call(token?: string) {
  return app.request("/", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

test("a request without a token returns a 401 problem", async () => {
  const res = await call();
  expect(res.status).toBe(401);
  expect(res.headers.get("Content-Type")).toBe("application/problem+json");
  expect(await res.json()).toMatchObject({
    type: "about:blank",
    title: "Unauthorized",
    status: 401,
  });
});

test("a valid Supabase token sets the user id and email", async () => {
  const res = await call(await sign());
  expect(await res.json()).toEqual({ userId: "user-1", email: "arjun@example.com" });
});

test("a Google token sets the name from the Google profile", async () => {
  const res = await call(await sign({ user_metadata: { full_name: " Arjun Mehta ", name: "Y" } }));
  expect(await res.json()).toMatchObject({ name: "Arjun Mehta" });
  const nameOnly = await call(await sign({ user_metadata: { name: "Arjun" } }));
  expect(await nameOnly.json()).toMatchObject({ name: "Arjun" });
});

test("a token signed with another secret returns 401", async () => {
  expect((await call(await sign({}, "another-secret-that-is-long-enough"))).status).toBe(401);
});

test("an expired token returns 401", async () => {
  expect((await call(await sign({ exp: "-1m" }))).status).toBe(401);
});

test("a token for another audience or issuer returns 401", async () => {
  expect((await call(await sign({ aud: "anon" }))).status).toBe(401);
  expect((await call(await sign({ iss: "https://evil.example.com/auth/v1" }))).status).toBe(401);
});

test("a malformed token returns 401", async () => {
  expect((await call("not-a-jwt")).status).toBe(401);
});

test("an ES256 token verifies against the project's public JWKS", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "key-1", alg: "ES256" };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ keys: [jwk] })),
  );
  const token = await new SignJWT({ email: "arjun@example.com" })
    .setProtectedHeader({ alg: "ES256", kid: "key-1" })
    .setSubject("user-2")
    .setAudience("authenticated")
    .setIssuer(issuer)
    .setExpirationTime("1h")
    .sign(privateKey);
  expect(await (await call(token)).json()).toEqual({
    userId: "user-2",
    email: "arjun@example.com",
  });
  vi.unstubAllGlobals();
});
