import { type SQL, sql } from "drizzle-orm";
import { encryptedShape, fieldPrefix, isEncrypted } from "../lib/crypto.js";
import { type Cipher, cipherFor } from "./user-keys.js";
import { db } from "./client.js";

const batchSize = 500;
const ownerOfProfile = "(select p.owner_user_id from profiles p where p.id = t.profile_id)";
const ownerOfReport =
  "(select p.owner_user_id from reports r join profiles p on p.id = r.profile_id where r.id = t.report_id)";

export const encryptedColumns = [
  {
    table: "profiles",
    owner: "t.owner_user_id",
    columns: ["name", "date_of_birth", "year_review_intro"],
  },
  { table: "episodes", owner: ownerOfProfile, columns: ["name", "note", "summary"] },
  {
    table: "reports",
    owner: ownerOfProfile,
    columns: ["title", "note", "narrative", "translations", "doctor_questions", "error"],
  },
  { table: "report_files", owner: ownerOfReport, columns: ["name"] },
  { table: "findings", owner: ownerOfReport, columns: ["title", "body"] },
  { table: "assistant_questions", owner: "t.user_id", columns: ["question", "answer"] },
] as const;

type Entry = (typeof encryptedColumns)[number];
type Executor = Pick<typeof db, "execute">;
type Row = Record<string, string | null> & { id: string; owner: string };

const column = (name: string) => sql`t.${sql.identifier(name)}`;
const plaintext = (name: string) =>
  sql`(${column(name)} is not null and ${column(name)} !~ ${encryptedShape})`;
const selectRows = ({ table, owner, columns }: Entry, where: SQL) =>
  sql`select t.id, ${sql.raw(owner)} as owner, ${sql.join(columns.map(column), sql`, `)}
    from ${sql.identifier(table)} t where ${where} order by t.id`;

/**
 * Writes the new value of each changed column of one row, only where the column still holds the value read.
 *
 * @remarks
 * The API may write the same row between the read and this update. The guard keeps that newer value.
 */
async function updateRow(
  executor: Executor,
  table: string,
  id: string,
  changes: { name: string; from: string; to: string }[],
) {
  const sets = changes.map(
    ({ name, from, to }) =>
      sql`${sql.identifier(name)} = case when ${sql.identifier(name)} = ${from} then ${to} else ${sql.identifier(name)} end`,
  );
  await executor.execute(
    sql`update ${sql.identifier(table)} set ${sql.join(sets, sql`, `)} where id = ${id}`,
  );
}

/**
 * Encrypts every plaintext value of one table in batches of 500, and returns how many rows it changed.
 *
 * @remarks
 * A value that starts with "v1:" is never touched, so a second run changes nothing. A batch that changes no value stops
 * the run, so a row the update cannot change never loops forever.
 */
export async function backfillTable(entry: Entry) {
  let total = 0;
  for (;;) {
    const where = sql.join(entry.columns.map(plaintext), sql` or `);
    const rows = (await db.execute<Row>(
      sql`${selectRows(entry, where)} limit ${batchSize}`,
    )) as Row[];
    if (rows.length === 0) return total;
    for (const row of rows) {
      const cipher = await cipherFor(row.owner);
      const changes = entry.columns.flatMap((name) => {
        const from = row[name];
        return from != null && !isEncrypted(from) ? [{ name, from, to: cipher.encrypt(from) }] : [];
      });
      await updateRow(db, entry.table, row.id, changes);
    }
    const [left] = (await db.execute<{ id: string }>(sql`${selectRows(entry, where)} limit 1`)) as {
      id: string;
    }[];
    if (left?.id === rows[0]!.id)
      throw new Error(`The backfill made no progress on ${entry.table}.`);
    total += rows.length;
  }
}

/** Counts the plaintext values left in each encrypted column, keyed `table.column`. */
export async function countPlaintext() {
  const counts: Record<string, number> = {};
  for (const { table, columns } of encryptedColumns) {
    const [row] = (await db.execute<Record<string, number>>(
      sql`select ${sql.join(
        columns.map(
          (name) => sql`count(*) filter (where ${plaintext(name)})::int as ${sql.identifier(name)}`,
        ),
        sql`, `,
      )} from ${sql.identifier(table)} t`,
    )) as Record<string, number>[];
    for (const name of columns) counts[`${table}.${name}`] = Number(row![name]);
  }
  return counts;
}

/**
 * Re-encrypts the values of rows now owned by `owner` that are still under the key of `from`.
 *
 * @remarks
 * Moving rows to another user moves no key, so the moved values must be decrypted with the old key and encrypted
 * with the new one. Pass the transaction that moved the rows.
 */
export async function rekeyRows(executor: Executor, from: Cipher, owner: string) {
  const to = await cipherFor(owner);
  const prefix = `${fieldPrefix}${from.keyId}:`;
  for (const entry of encryptedColumns) {
    const underFrom = sql.join(
      entry.columns.map((name) => sql`${column(name)} like ${`${prefix}%`}`),
      sql` or `,
    );
    const rows = (await executor.execute<Row>(
      selectRows(entry, sql`${sql.raw(entry.owner)} = ${owner} and (${underFrom})`),
    )) as Row[];
    for (const row of rows) {
      const changes = entry.columns.flatMap((name) => {
        const value = row[name];
        return value?.startsWith(prefix)
          ? [{ name, from: value, to: to.encrypt(from.decrypt(value)) }]
          : [];
      });
      await updateRow(executor, entry.table, row.id, changes);
    }
  }
}
