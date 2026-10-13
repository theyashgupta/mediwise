/** Names the kind of a report file from its type, or from its extension when the browser gives no type. */
export function fileKind(name: string, mime = "") {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (mime === "image/heic" || extension === "heic") return "heic";
  if (mime === "image/png" || extension === "png") return "png";
  if (mime === "image/webp" || extension === "webp") return "webp";
  return "jpg";
}

/** Formats a byte count in megabytes with one decimal. */
export function megabytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}
