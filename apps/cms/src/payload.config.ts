import { postgresAdapter } from "@payloadcms/db-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCmsConfig } from "./config";
import { migrations } from "./migrations";

export default buildCmsConfig(
  postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? "" },
    schemaName: "cms",
    push: false,
    migrationDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "migrations"),
    prodMigrations: migrations,
  }),
);
