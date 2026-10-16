import { masterKeys, rewrapUserKeys } from "../lib/user-keys.js";
import { log } from "../middleware/logger.js";
import { db } from "./client.js";

try {
  log.info(`rewrapped ${await rewrapUserKeys()} user keys under master key ${masterKeys.newest}`);
} catch (error) {
  log.error(error);
  process.exitCode = 1;
}
await db.$client.end();
