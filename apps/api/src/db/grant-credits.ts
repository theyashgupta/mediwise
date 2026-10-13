import { log } from "../middleware/logger.js";
import { grantCredits } from "../modules/credits/index.js";
import { db } from "./client.js";

const usage = "Usage: pnpm --filter @mediwise/api credits:grant <email> <n> <reason>";
const [email, count, ...reason] = process.argv.slice(2);
const credits = Number(count);
const note = reason.join(" ").trim();

if (!email || !Number.isInteger(credits) || credits === 0 || !note) {
  log.error(usage);
  process.exitCode = 1;
} else {
  try {
    const userId = await grantCredits(email, credits, note);
    log.info(`granted credits=${credits} user=${userId}`);
  } catch (error) {
    log.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
await db.$client.end();
