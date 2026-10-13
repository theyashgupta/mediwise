/**
 * Keeps a post-sign-in target on this site.
 *
 * @remarks
 * The target arrives in a URL, so anything that resolves to another origin falls back to `/` to block an open redirect.
 */
export function safeNext(next: string | null | undefined, origin: string) {
  if (!next) return "/";
  const url = new URL(next, origin);
  return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/";
}

/**
 * Reads the error and the target page that Supabase puts on the `/auth/callback` URL.
 *
 * @remarks
 * A cancel at Google arrives as `error=access_denied`, which wins over the Supabase `error_code` so the user sees the cancel message.
 */
export function readCallback(url: URL) {
  const params = new URLSearchParams(url.hash.slice(1));
  url.searchParams.forEach((value, key) => params.set(key, value));
  const error = params.get("error");
  return {
    error: error === "access_denied" ? error : params.get("error_code") || error || undefined,
    next: safeNext(params.get("next"), url.origin),
  };
}
