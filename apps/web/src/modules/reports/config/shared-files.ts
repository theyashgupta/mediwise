const shareCache = "mediwise-share";
const shareKey = "/share-target/files";

/** Keeps only `shared=1` on the upload page URL, the flag `sw.js` sets after a share. */
export function validateUploadSearch(search: Record<string, unknown>): { shared?: 1 } {
  return search.shared === 1 || search.shared === "1" ? { shared: 1 } : {};
}

/**
 * Reads the files that `sw.js` kept from a share, then deletes them from Cache Storage.
 *
 * @remarks
 * The cache name and key must match `public/sw.js`. After this call the files live only in page memory.
 */
export async function takeSharedFiles(): Promise<File[]> {
  if (!("caches" in window)) return [];
  const response = await caches.match(shareKey, { cacheName: shareCache });
  await caches.delete(shareCache);
  if (!response) return [];
  const form = await response.formData();
  return form.getAll("files").filter((file) => file instanceof File);
}

/** Tells the user how many shared files we added and what to do next. */
export function sharedFilesLine(count: number) {
  const files = count === 1 ? "1 file" : `${count} files`;
  return `We added ${files} from another app. Check the profile. Then select Read my report.`;
}
