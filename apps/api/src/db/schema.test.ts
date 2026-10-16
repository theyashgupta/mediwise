import { getTableName, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import * as schema from "./schema.js";

const dir = new URL("./migrations/", import.meta.url);
const sql = readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(new URL(name, dir), "utf8"))
  .join("\n");
const pgTables = Object.values(schema).filter((value) => is(value, PgTable));

test("every table turns on row level security in a migration", () => {
  const tables = pgTables.map((table) => getTableName(table));

  expect(tables).toContain("report_shares");
  expect(tables).toContain("report_links");
  expect(tables).toContain("episodes");
  expect(
    tables.filter((table) => !sql.includes(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`)),
  ).toEqual([]);
});

test("the last migration of every foreign key adds it with the column and delete rule of the schema", () => {
  const foreignKeys = pgTables.flatMap((table) => getTableConfig(table).foreignKeys);
  const added = (name: string) =>
    [
      ...sql.matchAll(
        new RegExp(`ADD CONSTRAINT "${name}" (FOREIGN KEY .*? ON DELETE [a-z ]+?) ON UPDATE`, "g"),
      ),
    ].at(-1)?.[1];

  expect(foreignKeys.length).toBeGreaterThan(20);
  for (const key of foreignKeys) {
    const { columns, foreignColumns } = key.reference();
    const target = getTableName(foreignColumns[0]!.table);
    expect(added(key.getName())).toBe(
      `FOREIGN KEY ("${columns[0]!.name}") REFERENCES "public"."${target}"("${foreignColumns[0]!.name}") ON DELETE ${key.onDelete ?? "no action"}`,
    );
  }
});
