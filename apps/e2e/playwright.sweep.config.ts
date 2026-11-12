import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "sweep",
  timeout: 900_000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    locale: "en-GB",
    testIdAttribute: "data-testid",
    actionTimeout: 15_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
