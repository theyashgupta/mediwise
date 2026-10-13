import { maxFiles, maxTotalBytes } from "@mediwise/shared";
import { CircleCheck, Info, X } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { megabytes } from "../config/files";
import { type PhotoFlags, photoWarnings } from "../config/photo-check";
import { FileTypeIcon } from "./file-type-icon";

type FilePreviewListProps = {
  files: File[];
  progress: number[];
  photoFlags: (PhotoFlags | undefined)[];
  uploading: boolean;
  onRemove: (index: number) => void;
};

const browserImages = ["image/jpeg", "image/png", "image/webp"];

function Thumbnail({ file }: { file: File }) {
  const attachPreview = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const url = URL.createObjectURL(file);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );
  return browserImages.includes(file.type) ? (
    <img ref={attachPreview} alt="" className="size-9 shrink-0 rounded-lg border object-cover" />
  ) : (
    <FileTypeIcon name={file.name} mime={file.type} />
  );
}

export function FilePreviewList({
  files,
  progress,
  photoFlags,
  uploading,
  onRemove,
}: FilePreviewListProps) {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return (
    <section aria-label="Selected files" className="overflow-hidden rounded-xl border bg-card">
      <p className="flex justify-between gap-4 border-b px-4 py-2 text-xs text-muted-foreground">
        <span>
          <span className="font-mono">{files.length}</span> of{" "}
          <span className="font-mono">{maxFiles}</span> files
        </span>
        <span>
          <span className="font-mono">{megabytes(total)}</span> of{" "}
          <span className="font-mono">{maxTotalBytes / 1024 / 1024}</span> MB
        </span>
      </p>
      <ul className="divide-y">
        {files.map((file, index) => {
          const percent = Math.round((progress[index] ?? 0) * 100);
          return (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <Thumbnail file={file} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{file.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {uploading ? `${percent}%` : `${megabytes(file.size)} MB`}
                  </span>
                </p>
                {uploading && <Progress value={percent} aria-label={`Uploading ${file.name}`} />}
                {photoWarnings(photoFlags[index]).map((warning) => (
                  <p
                    key={warning}
                    className="flex items-start gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                    {warning}
                  </p>
                ))}
              </div>
              {uploading ? (
                percent === 100 && (
                  <CircleCheck className="size-4 shrink-0 text-primary" aria-label="Uploaded" />
                )
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X aria-hidden />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
