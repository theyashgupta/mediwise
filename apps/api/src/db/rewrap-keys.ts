import { log } from "../middleware/logger.js";
import { db } from "./client.js";
import { rewrapToV2 } from "./user-keys.js";

try {
  log.info(`rewrapped ${await rewrapToV2()} user keys under master key v2`);
} catch (error) {
  log.error(error);
  process.exitCode = 1;
}
await db.$client.end();
