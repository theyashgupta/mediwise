/**
 * PUTs one file to a signed storage URL and reports progress from 0 to 1.
 *
 * @remarks
 * Uses XMLHttpRequest because `fetch` has no upload progress event in Safari or Firefox.
 */
export function uploadFile(
  url: string,
  file: File,
  mime: string,
  onProgress: (fraction: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(`${file.name} did not upload`));
    xhr.onerror = () => reject(new Error(`${file.name} did not upload. Check your connection.`));
    xhr.send(file);
  });
}
