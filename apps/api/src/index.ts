import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { startWorker } from "./jobs/worker.js";
import { log } from "./middleware/logger.js";

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  log.info(`api listening on http://localhost:${info.port}`);
});

const worker = env.RUN_WORKER ? startWorker() : undefined;

process.once("SIGTERM", async () => {
  await worker?.stop();
  server.close(() => process.exit(0));
});
