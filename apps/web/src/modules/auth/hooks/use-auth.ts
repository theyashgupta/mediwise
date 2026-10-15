import { policyVersion, requiredConsentKinds } from "@mediwise/shared";
import type { AuthError } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";
import { giveConsents } from "@/modules/me";
import { authErrorMessage } from "../config/messages";
import type { Credentials, EmailInput } from "../config/schemas";

async function unwrap<T extends { error: AuthError | null }>(call: Promise<T>) {
  const result = await call;
  if (result.error) throw new Error(authErrorMessage(result.error));
  return result;
}

export function useSignIn() {
  return useMutation({
    mutationFn: (input: Credentials) => unwrap(supabase.auth.signInWithPassword(input)),
  });
}

/**
 * Creates an account and stores both consents ticked on the form.
 *
 * @remarks
 * Without a session (email confirmation on) the consents cannot be stored yet, so `consent_version` carries them to the first upload, which is also the fallback when this store fails.
 */
export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const result = await unwrap(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { consent_version: policyVersion },
          },
        }),
      );
      if (result.data.session) await giveConsents([...requiredConsentKinds]).catch(() => undefined);
      return result;
    },
  });
}

/**
 * Fails with app copy when the Supabase project has the Google provider off.
 *
 * @remarks
 * Without this check the browser opens a raw JSON page that says "provider is not enabled".
 */
async function assertGoogleEnabled() {
  const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: env.supabaseAnonKey },
  }).catch(() => undefined);
  if (!res?.ok) throw new Error(authErrorMessage({}));
  const settings = (await res.json()) as { external?: { google?: boolean } };
  if (!settings.external?.google) throw new Error(authErrorMessage({ code: "provider_disabled" }));
}

/** Starts the Google redirect. The browser leaves the app, so success never resolves here. */
export function useGoogleSignIn(next = "/") {
  return useMutation({
    mutationFn: async () => {
      await assertGoogleEnabled();
      return unwrap(
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        }),
      );
    },
  });
}

export function useSendResetLink() {
  return useMutation({
    mutationFn: ({ email }: EmailInput) =>
      unwrap(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      ),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (password: string) => unwrap(supabase.auth.updateUser({ password })),
  });
}

/**
 * Signs the user out of this browser.
 *
 * @remarks
 * The router listens for `SIGNED_OUT`, clears the query cache and opens `/login`.
 */
export function useSignOut() {
  return useMutation({ mutationFn: () => unwrap(supabase.auth.signOut({ scope: "local" })) });
}
