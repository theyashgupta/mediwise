import { log } from "../middleware/logger.js";
import { db } from "./client.js";
import { backfillTable, countPlaintext, encryptedColumns } from "./encrypted-columns.js";

const countOnly = process.argv[2] === "count";

try {
  if (!countOnly) {
    for (const entry of encryptedColumns) {
      log.info(`encrypted ${await backfillTable(entry)} rows of ${entry.table}`);
    }
  }
  const counts = await countPlaintext();
  for (const [name, count] of Object.entries(counts)) log.info(`plaintext ${name}=${count}`);
  if (Object.values(counts).some((count) => count > 0)) process.exitCode = 1;
} catch (error) {
  log.error(error);
  process.exitCode = 1;
}
await db.$client.end();
