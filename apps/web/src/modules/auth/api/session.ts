import { type ParsedLocation, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { readCallback } from "../config/callback";

/** Route guard: sends a visitor without a session to `/login`, and keeps the page they asked for. */
export async function requireSession({ location }: { location: ParsedLocation }) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/login", search: location.href === "/" ? {} : { next: location.href } });
  }
}

/** Route guard: sends a signed-in user from a sign-in page to `/`. */
export async function redirectIfSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) throw redirect({ to: "/" });
}

/**
 * Route guard for `/auth/callback`: sends the user to the page they came from, or to `/login` with the error.
 *
 * @remarks
 * `getSession` waits for the client to swap the PKCE code, so a session here means the exchange worked.
 */
export async function finishOAuth({ location }: { location: ParsedLocation }) {
  const { error, next } = readCallback(new URL(location.href, window.location.origin));
  if (error) throw redirect({ to: "/login", search: { error } });
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw redirect({ to: "/login", search: { error: "oauth_failed" } });
  throw redirect({ href: next });
}
