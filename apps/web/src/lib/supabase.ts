import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * The browser Supabase client.
 *
 * @remarks
 * PKCE sends a `?code=` back, and the client swaps it for a session on page load, so Google, email confirm and reset links need no exchange code of their own.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { flowType: "pkce" },
});
