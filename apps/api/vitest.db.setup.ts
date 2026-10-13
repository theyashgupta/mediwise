import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { execFileSync } from "node:child_process";
import postgres from "postgres";

const testDatabase = "mediwise_test";

const { DB_URL: adminUrl } = JSON.parse(
  execFileSync("supabase", ["status", "--workdir", "../e2e", "--output", "json"], {
    cwd: import.meta.dirname,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
) as { DB_URL: string };

const url = new URL(adminUrl);
url.pathname = `/${testDatabase}`;
export const testDatabaseUrl = url.toString();

/**
 * Recreates the test database on the e2e local Supabase and applies every migration.
 *
 * @remarks
 * A separate database, not the `postgres` one the e2e suite uses, so a db run never touches e2e data and each run starts empty.
 */
export async function setup() {
  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${testDatabase} with (force)`);
  await admin.unsafe(`create database ${testDatabase}`);
  await admin.end();
  const client = postgres(testDatabaseUrl, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), {
    migrationsFolder: new URL("src/db/migrations", import.meta.url).pathname,
  });
  await client.end();
}
