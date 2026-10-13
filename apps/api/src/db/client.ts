import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

/**
 * Drizzle client over the Supabase Postgres.
 *
 * @remarks
 * `prepare: false` because the Supabase transaction pooler does not support prepared statements.
 */
export const db = drizzle(postgres(env.DATABASE_URL, { prepare: false }), { schema });
