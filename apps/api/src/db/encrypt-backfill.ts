import { log } from "../middleware/logger.js";
import { db } from "./client.js";
import { encryptBackfill } from "./encrypted-columns.js";

try {
  const { encrypted, plaintext } = await encryptBackfill(process.argv[2]);
  for (const [table, rows] of Object.entries(encrypted))
    log.info(`encrypted ${rows} rows of ${table}`);
  for (const [name, count] of Object.entries(plaintext)) log.info(`plaintext ${name}=${count}`);
  if (Object.values(plaintext).some((count) => count > 0)) process.exitCode = 1;
} catch (error) {
  log.error(error);
  process.exitCode = 1;
}
await db.$client.end();
