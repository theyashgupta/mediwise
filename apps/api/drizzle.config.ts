import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
