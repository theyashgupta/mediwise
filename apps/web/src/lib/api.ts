import type { AppType } from "@mediwise/api";
import { hc } from "hono/client";
import { getLocale } from "@/common/hooks/use-locale";
import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";

/**
 * Builds the headers of every API call: the session token and the language the user picked.
 *
 * @remarks
 * The API writes catalog and report text in the `Accept-Language` locale, so the header carries the app choice, not the browser list.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const language = { "Accept-Language": getLocale() };
  return data.session
    ? { ...language, Authorization: `Bearer ${data.session.access_token}` }
    : language;
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
