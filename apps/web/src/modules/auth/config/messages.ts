import { getT } from "@/common/hooks/use-locale";

/**
 * Turns a Supabase Auth error into a sentence for the user.
 *
 * @remarks
 * Supabase messages do not follow the app copy rules, so only the error code is used.
 */
export function authErrorMessage(error: { code?: string }) {
  const t = getT().auth;
  const errors: Record<string, string> = t.errors;
  return error.code && Object.hasOwn(errors, error.code) ? errors[error.code] : t.errorFallback;
}
