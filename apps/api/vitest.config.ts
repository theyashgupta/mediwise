import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/*.db.test.ts"],
    env: {
      NODE_ENV: "test",
      CORS_ORIGINS: "https://app.mediwise.theyashgupta.me, https://mediwise.pages.dev/",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test",
      SUPABASE_JWT_SECRET: "test-secret-that-is-long-enough-for-hs256",
    },
  },
});
