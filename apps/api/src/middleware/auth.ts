import { createMiddleware } from "hono/factory";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { problem } from "../common/problem.js";
import { env } from "../config/env.js";

export type AuthEnv = { Variables: { userId: string; email: string; name?: string } };

const secret = env.SUPABASE_JWT_SECRET && new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
const jwks = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", env.SUPABASE_URL));

/**
 * Picks the key for a Supabase access token.
 *
 * @remarks
 * HS256 tokens use the legacy JWT secret. A project on asymmetric signing keys issues ES256 or RS256 tokens, which verify against its public JWKS.
 */
const getKey: JWTVerifyGetKey = (header, token) =>
  header.alg === "HS256" && secret ? secret : jwks(header, token);

/**
 * Verifies the Supabase access token and sets `c.var.userId`, `c.var.email` and `c.var.name`.
 *
 * @remarks
 * Tests run as the fixed `DEV_USER_ID`, so route tests need no token.
 * `name` comes from the Google profile in `user_metadata`, and an email account has none.
 */
export const auth = createMiddleware<AuthEnv>(async (c, next) => {
  if (env.NODE_ENV === "test") {
    c.set("userId", env.DEV_USER_ID);
    c.set("email", `${env.DEV_USER_ID}@example.com`);
    return next();
  }
  const token = c.req.header("Authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return problem(c, 401, "Unauthorized", "Sign in to continue.");
  const payload = await jwtVerify(token, getKey, {
    algorithms: secret ? ["HS256", "ES256", "RS256"] : ["ES256", "RS256"],
    audience: "authenticated",
    issuer: new URL("/auth/v1", env.SUPABASE_URL).href,
  }).then(
    (result) => result.payload,
    () => undefined,
  );
  if (!payload?.sub)
    return problem(c, 401, "Unauthorized", "Your session is not valid. Sign in again.");
  c.set("userId", payload.sub);
  c.set("email", typeof payload.email === "string" ? payload.email : "");
  c.set("name", profileName(payload.user_metadata));
  await next();
});

function profileName(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return undefined;
  const { full_name: fullName, name } = metadata as Record<string, unknown>;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return undefined;
}
