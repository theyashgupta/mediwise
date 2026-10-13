import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import * as schema from "./schema.js";

test("every table turns on row level security in a migration", () => {
  const dir = new URL("./migrations/", import.meta.url);
  const sql = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .map((name) => readFileSync(new URL(name, dir), "utf8"))
    .join("\n");
  const tables = Object.values(schema)
    .filter((value) => is(value, PgTable))
    .map((table) => getTableName(table));

  expect(tables).toContain("report_shares");
  expect(tables).toContain("report_links");
  expect(
    tables.filter((table) => !sql.includes(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)),
  ).toEqual([]);
});
