const shareCache = "mediwise-share";
const shareKey = "/share-target/files";
const shellPrefix = "mediwise-shell-";
const build = self.mediwiseBuild ?? { version: "dev", files: [] };
const shellCache = shellPrefix + build.version;

/**
 * Keeps the app shell of this build: `index.html` at `/` and the content-hashed files it loads.
 *
 * @remarks
 * The build writes `self.mediwiseBuild` above this file. The dev server has no build, so it keeps nothing.
 */
self.addEventListener("install", (event) => {
  if (build.files.length === 0) return;
  event.waitUntil(caches.open(shellCache).then((cache) => cache.addAll(build.files)));
});

/** Deletes the shell of every earlier build, so no cache outlives a deploy. */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(shellPrefix) && name !== shellCache)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Starts a waiting build when the page asks for it.
 *
 * @remarks
 * A new build waits, so the page swaps only after the user taps "Update" and never in the middle of a form.
 */
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

/**
 * Answers the share target POST and the shell files, and lets the browser handle every other request.
 *
 * @remarks
 * Only files of the build list go into the shell cache. API responses never enter Cache Storage, so health data from the API never stays in the browser cache.
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api")) return;
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(keepSharedFiles(event.request));
    return;
  }
  if (event.request.method !== "GET" || build.files.length === 0) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => fromShell("/")));
  } else if (build.files.includes(url.pathname)) {
    event.respondWith(fromShell(url.pathname).then((kept) => kept ?? fetch(event.request)));
  }
});

/** Reads one file from the shell cache of this build. */
async function fromShell(path) {
  const cache = await caches.open(shellCache);
  return cache.match(path);
}

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
