import type { AppType } from "@mediwise/api";
import { hc } from "hono/client";
import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

/**
 * Calls `fetch` and signs the user out when the API answers 401.
 *
 * @remarks
 * Sign-out fires the `SIGNED_OUT` event, and the router listener sends the user to `/login`.
 */
async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  if (res.status === 401) await supabase.auth.signOut({ scope: "local" });
  return res;
}

export const api = hc<AppType>(env.apiUrl, { headers: authHeaders, fetch: authFetch });
