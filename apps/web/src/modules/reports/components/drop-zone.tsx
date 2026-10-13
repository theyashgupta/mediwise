import { maxFileBytes, maxFiles, maxTotalBytes, reportMimes } from "@mediwise/shared";
import { FileUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const photoTips = [
  "Use daylight or a bright room.",
  "Fit one full page in each photo.",
  "Hold the phone flat above the page.",
];

type DropZoneProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
};

export function DropZone({ disabled, onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(!disabled);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFiles([...event.dataTransfer.files]);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-primary/60 hover:bg-accent",
        dragging && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileUp className="size-6" aria-hidden />
      </span>
      <span className="space-y-1">
        <span className="block text-lg font-medium">Drop your report here, or choose files</span>
        <span className="block text-sm text-muted-foreground">
          Up to <span className="font-mono">{maxFiles}</span> PDFs or photos,{" "}
          <span className="font-mono">{maxFileBytes / 1024 / 1024}</span> MB each and{" "}
          <span className="font-mono">{maxTotalBytes / 1024 / 1024}</span> MB in total
        </span>
        <span className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          {photoTips.map((tip) => (
            <span key={tip}>{tip}</span>
          ))}
        </span>
      </span>
      <input
        type="file"
        multiple
        accept={[...reportMimes, ".heic"].join(",")}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </label>
  );
}
