const messages: Record<string, string> = {
  invalid_credentials: "The email or the password is not correct.",
  email_not_confirmed: "Confirm your email first. Open the link that we sent to you.",
  user_already_exists: "An account with this email exists. Sign in.",
  weak_password: "This password is too weak. Use a longer password.",
  same_password: "Use a password that is different from your current password.",
  over_email_send_rate_limit: "We sent too many emails. Wait one hour, then try again.",
  over_request_rate_limit: "You tried too many times. Wait a few minutes, then try again.",
  provider_disabled: "Google sign-in is not available yet. Use your email and password.",
  access_denied: "You stopped the Google sign-in. You can try again or use your email.",
  oauth_failed: "We could not sign you in with Google. Try again.",
};

/**
 * Turns a Supabase Auth error into a sentence for the user.
 *
 * @remarks
 * Supabase messages do not follow the app copy rules, so only the error code is used.
 */
export function authErrorMessage(error: { code?: string }) {
  return (error.code && messages[error.code]) || "We could not complete this. Try again.";
}
