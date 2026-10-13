import { execFileSync } from "node:child_process";

const status = JSON.parse(
  execFileSync("supabase", ["status", "--workdir", import.meta.dirname, "--output", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
) as Record<"API_URL" | "DB_URL" | "ANON_KEY" | "SERVICE_ROLE_KEY" | "JWT_SECRET", string>;

export const webOrigin = "http://localhost:5174";
export const shellOrigin = "http://localhost:5175";
export const landingOrigin = "http://localhost:3200";
export const apiPort = 3101;
export const adminUserId = "00000000-0000-4000-8000-00000000ad01";

export const apiEnv = {
  NODE_ENV: "development",
  PORT: String(apiPort),
  CORS_ORIGINS: `${webOrigin},${shellOrigin}`,
  DATABASE_URL: status.DB_URL,
  SUPABASE_URL: status.API_URL,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: status.JWT_SECRET,
  RUN_WORKER: "true",
  CLAUDE_STUB: "true",
  ANTHROPIC_API_KEY: "",
  CLAUDE_HARD_STOP: "false",
  ADMIN_USER_ID: adminUserId,
  PAYMENTS_ENABLED: "true",
  CASHFREE_STUB: "true",
  CASHFREE_APP_ID: "e2e-app-id",
  CASHFREE_SECRET_KEY: "e2e-secret-key",
  CASHFREE_ENV: "sandbox",
};

export const webEnv = {
  VITE_API_URL: `http://localhost:${apiPort}`,
  VITE_SUPABASE_URL: status.API_URL,
  VITE_SUPABASE_ANON_KEY: status.ANON_KEY,
  VITE_PAYMENTS_ENABLED: "true",
  VITE_CASHFREE_MODE: "sandbox",
  VITE_APP_ORIGIN: webOrigin,
};
