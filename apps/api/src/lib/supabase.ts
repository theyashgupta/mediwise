import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Supabase admin client with the service role key.
 *
 * @remarks
 * The service role bypasses RLS, so this client stays on the server and every caller scopes by `c.var.userId` itself.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
