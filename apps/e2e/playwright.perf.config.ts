import { defineConfig } from "@playwright/test";
import config from "./playwright.config";
import { landingOrigin, webEnv, webOrigin } from "./local-env";

const [api] = Array.isArray(config.webServer) ? config.webServer : [];
const port = (origin: string) => new URL(origin).port;

export default defineConfig({
  ...config,
  testDir: "perf",
  timeout: 300_000,
  projects: undefined,
  webServer: [
    api!,
    {
      command: `pnpm turbo run build --filter @mediwise/web --filter @mediwise/landing && node perf/serve.ts ${port(webOrigin)} ${port(landingOrigin)}`,
      url: landingOrigin,
      env: webEnv,
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
