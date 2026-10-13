/**
 * Saves a blob as a file on the user's device.
 *
 * @remarks
 * The object URL is revoked a moment later, because Safari can cancel a download whose URL is revoked during the click.
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
