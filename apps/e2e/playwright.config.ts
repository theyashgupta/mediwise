import { defineConfig, devices } from "@playwright/test";
import { apiEnv, apiPort, webEnv, webOrigin } from "./local-env";

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: ci,
  retries: 0,
  workers: 1,
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: webOrigin,
    testIdAttribute: "data-testid",
    actionTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "pnpm --filter @mediwise/api db:migrate && pnpm --filter @mediwise/api exec tsx --conditions=development --env-file-if-exists=.env src/index.ts",
      url: `http://localhost:${apiPort}/health`,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @mediwise/web exec vite --port ${new URL(webOrigin).port} --strictPort`,
      url: webOrigin,
      env: webEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
