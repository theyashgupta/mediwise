import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { getPayload } from "payload";
import { buildCmsConfig } from "./config";

/**
 * Starts Payload on a new SQLite file with the production collections.
 *
 * @remarks
 * A file, not `:memory:`, because libsql opens a fresh in-memory database for each transaction.
 */
export function createTestPayload() {
  const url = `file:${path.join(tmpdir(), `mediwise-cms-${randomUUID()}.db`)}`;
  return getPayload({ config: buildCmsConfig(sqliteAdapter({ client: { url } })) });
}
