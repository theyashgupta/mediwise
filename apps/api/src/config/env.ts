import { z } from "zod";

/**
 * Parses a comma-separated origin list into the exact strings a browser sends in `Origin`.
 *
 * @remarks
 * `new URL().origin` drops a trailing slash or path, which would otherwise never match and block every request.
 */
export function parseOrigins(list: string) {
  return z
    .array(z.url().transform((url) => new URL(url).origin))
    .min(1)
    .parse(
      list
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
}

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGINS: z.string().optional(),
    WEB_ORIGIN: z.url().optional(),
    DATABASE_URL: z.url(),
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_JWT_SECRET: z.string().min(1).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DEV_USER_ID: z.string().min(1).default("dev-user"),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
    ANTHROPIC_EXTRACT_MODEL: z.string().min(1).default("claude-haiku-5-5"),
    ANTHROPIC_NARRATIVE_MODEL: z.string().min(1).default("claude-haiku-5-5"),
    ANTHROPIC_FINDINGS_MODEL: z.string().min(1).default("claude-haiku-5-5"),
    RUN_WORKER: z.stringbool().default(false),
    CLAUDE_STUB: z.stringbool().default(false),
    CLAUDE_MONTHLY_CAP_CENTS: z.coerce.number().int().nonnegative().default(2000),
    CLAUDE_HARD_STOP: z.stringbool().default(false),
    ADMIN_USER_ID: z.string().min(1).optional(),
    PAYMENTS_ENABLED: z.stringbool().default(false),
    CASHFREE_APP_ID: z.string().min(1).optional(),
    CASHFREE_SECRET_KEY: z.string().min(1).optional(),
    CASHFREE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
    PAYMENTS_WEBHOOK_URL: z.url().optional(),
  })
  .refine(
    (e) => !e.PAYMENTS_ENABLED || (e.CASHFREE_APP_ID && e.CASHFREE_SECRET_KEY),
    "PAYMENTS_ENABLED=true needs CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
  )
  .refine(
    (e) => !(e.CLAUDE_STUB && e.NODE_ENV === "production"),
    "CLAUDE_STUB=true is for the e2e suite only, never in production.",
  )
  .transform(({ CORS_ORIGINS, WEB_ORIGIN, ...rest }) => ({
    ...rest,
    CORS_ORIGINS: parseOrigins(CORS_ORIGINS ?? WEB_ORIGIN ?? "http://localhost:5173"),
  }));

/**
 * Process environment, validated once at startup.
 *
 * @remarks
 * Empty values are dropped before parsing so a `.env` copied from `.env.example` falls back to defaults. `WEB_ORIGIN` is read only when `CORS_ORIGINS` is unset, for one release.
 */
export const env = envSchema.parse(
  Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== "")),
);
