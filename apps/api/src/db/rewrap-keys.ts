import { log } from "../middleware/logger.js";
import { db } from "./client.js";
import { masterKeys, rewrapUserKeys } from "./user-keys.js";

try {
  if (masterKeys.newest !== "v2") throw new Error("Set DATA_KEY_V2 before a rewrap.");
  log.info(`rewrapped ${await rewrapUserKeys()} user keys under master key ${masterKeys.newest}`);
} catch (error) {
  log.error(error);
  process.exitCode = 1;
}
await db.$client.end();
