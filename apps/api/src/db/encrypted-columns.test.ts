import { getTableName, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { expect, test } from "vitest";
import { encryptBackfill, encryptedColumns } from "./encrypted-columns.js";
import * as schema from "./schema.js";

const tables = new Map(
  Object.values(schema)
    .filter((value) => is(value, PgTable))
    .map((table) => [getTableName(table), table]),
);

test("every encrypted column names a text column of a table in the schema", () => {
  for (const { table, columns } of encryptedColumns) {
    const config = getTableConfig(tables.get(table)!);
    const types = new Map(config.columns.map((column) => [column.name, column.getSQLType()]));

    expect(columns.map((name) => [name, types.get(name)])).toEqual(
      columns.map((name) => [name, "text"]),
    );
  }
});

test("a backfill with an unknown mode stops before it reads a row", async () => {
  await expect(encryptBackfill("all")).rejects.toThrow("Usage: pnpm db:encrypt-backfill [count]");
});
