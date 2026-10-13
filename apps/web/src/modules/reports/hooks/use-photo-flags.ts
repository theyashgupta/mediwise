import { useQueries } from "@tanstack/react-query";
import { fileKind } from "../config/files";
import { checkSize, photoFlags } from "../config/photo-check";

/**
 * Draws a photo on a canvas at check size and flags it.
 *
 * @remarks
 * High smoothing makes the canvas average the pixels it drops, as the calibration resize did.
 */
async function readPhotoFlags(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const size = checkSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("No canvas");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const { data } = context.getImageData(0, 0, size.width, size.height);
  const grey = new Uint8ClampedArray(size.width * size.height);
  for (let i = 0; i < grey.length; i++)
    grey[i] =
      0.299 * (data[i * 4] ?? 0) + 0.587 * (data[i * 4 + 1] ?? 0) + 0.114 * (data[i * 4 + 2] ?? 0);
  return photoFlags(width, height, grey);
}

/**
 * Checks each selected JPG, PNG or WebP photo in the browser and returns its flags, in file order.
 *
 * @remarks
 * PDF and HEIC files get no flags, because Chrome cannot draw HEIC. A photo the browser cannot decode gets none.
 */
export function usePhotoFlags(files: File[]) {
  return useQueries({
    queries: files.map((file) => {
      const kind = fileKind(file.name, file.type);
      return {
        queryKey: ["photo-flags", file.name, file.size, file.lastModified],
        queryFn: () => readPhotoFlags(file),
        enabled: kind !== "pdf" && kind !== "heic",
        staleTime: Infinity,
        retry: false,
      };
    }),
    combine: (results) => results.map((result) => result.data),
  });
}
