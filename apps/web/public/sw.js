const shareCache = "mediwise-share";
const shareKey = "/share-target/files";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/**
 * Answers only the share target POST and lets the browser handle every other request.
 *
 * @remarks
 * No other response is ever put in Cache Storage, so health data from the API never stays in the browser cache.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.origin !== location.origin) return;
  if (url.pathname !== "/share-target") return;
  event.respondWith(keepSharedFiles(event.request));
});

/**
 * Keeps the shared files under one key until the upload page reads them, then opens that page.
 *
 * @remarks
 * The files stay as one multipart body, so the page gets back each name and type with `formData()`.
 */
async function keepSharedFiles(request) {
  const shared = await request.formData();
  const form = new FormData();
  for (const file of shared.getAll("files")) {
    if (file instanceof File) form.append("files", file, file.name);
  }
  const cache = await caches.open(shareCache);
  await cache.put(shareKey, new Response(form));
  return Response.redirect(new URL("/reports/upload?shared=1", location.origin).href, 303);
}
