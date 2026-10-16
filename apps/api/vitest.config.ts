import { configDefaults, defineConfig } from "vitest/config";

/**
 * Caps Vitest at 3 workers on a laptop and keeps the Vitest default in CI.
 *
 * @remarks
 * Two `pnpm check` runs at once on an 8 GB Mac start up to 28 workers on 8 cores, and tests then pass their timeout.
 */
function testWorkers() {
  return process.env.CI ? undefined : 3;
}

export default defineConfig({
  test: {
    name: "unit",
    maxWorkers: testWorkers(),
    exclude: [...configDefaults.exclude, "**/*.db.test.ts"],
    env: {
      NODE_ENV: "test",
      CORS_ORIGINS: "https://app.mediwise.theyashgupta.me, https://mediwise.pages.dev/",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test",
      SUPABASE_JWT_SECRET: "test-secret-that-is-long-enough-for-hs256",
      DATA_KEY_V1: "dGVzdC1kYXRhLWtleS12MS1ub3QtYS1yZWFsLWtleSE=",
    },
  },
});
