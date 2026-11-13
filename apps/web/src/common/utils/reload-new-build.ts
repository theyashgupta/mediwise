const reloadKey = "mediwise-reload";

/**
 * Reloads the page once per build when a code file fails to load, so the tab gets the files of the latest deploy.
 *
 * @remarks
 * The key holds the URL of the running entry file. A reload that brings the same build back stops here, so an outage shows the error screen instead of a reload loop. The error is not prevented, so TanStack Router keeps the old page on screen until the reload starts.
 */
export function reloadForNewBuild() {
  try {
    if (sessionStorage.getItem(reloadKey) === import.meta.url) return;
    sessionStorage.setItem(reloadKey, import.meta.url);
  } catch {
    return;
  }
  location.reload();
}
