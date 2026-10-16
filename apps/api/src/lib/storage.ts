import { supabase } from "./supabase.js";

export const reportsBucket = "reports";

const bucket = () => supabase.storage.from(reportsBucket);

/**
 * Unwraps a Supabase storage result.
 *
 * @remarks
 * Throws so the error reaches `handleError` as a bare 500 instead of leaking storage details.
 */
function unwrap<T>({ data, error }: { data: T | null; error: Error | null }): T {
  if (error) throw error;
  return data as T;
}

/** Creates the private `reports` bucket if it does not exist yet. */
export async function ensureReportsBucket() {
  const { data } = await supabase.storage.getBucket(reportsBucket);
  if (data) return;
  unwrap(await supabase.storage.createBucket(reportsBucket, { public: false }));
}

/** Returns a URL the client can PUT one file to, valid for 2 hours. */
export async function createSignedUploadUrl(path: string) {
  return unwrap(await bucket().createSignedUploadUrl(path));
}

const downloadUrlSeconds = 300;

/**
 * Returns a download URL for each file that exists, valid for 5 minutes, saved under its given name.
 *
 * @remarks
 * The expiry is fixed, so no caller can make a longer-lived link to a health report.
 */
export async function createSignedDownloadUrls<T extends { path: string; name: string }>(
  files: T[],
) {
  if (files.length === 0) return [];
  const signed = unwrap(
    await bucket().createSignedUrls(
      files.map((file) => file.path),
      downloadUrlSeconds,
    ),
  );
  return files.flatMap((file) => {
    const url = signed.find((row) => row.path === file.path && !row.error)?.signedUrl;
    return url ? [{ ...file, url: `${url}&download=${encodeURIComponent(file.name)}` }] : [];
  });
}

export async function list(prefix: string) {
  return unwrap(await bucket().list(prefix));
}

export async function remove(paths: string[]) {
  return unwrap(await bucket().remove(paths));
}

export async function upload(path: string, data: Buffer, contentType: string) {
  return unwrap(await bucket().upload(path, data, { contentType, upsert: true }));
}

export async function download(path: string) {
  return Buffer.from(await unwrap(await bucket().download(path)).arrayBuffer());
}
