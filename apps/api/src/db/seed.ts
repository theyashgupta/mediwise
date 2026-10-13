import { ensureReportsBucket, reportsBucket } from "../lib/storage.js";
import { log } from "../middleware/logger.js";

await ensureReportsBucket();
log.info(`storage bucket "${reportsBucket}" is ready`);
