import { maxFileBytes, maxFiles, maxTotalBytes, reportMimes } from "@mediwise/shared";
import { FileUp } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";

type DropZoneProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
};

const mb = 1024 * 1024;

export function MonoNumbers({ text }: { text: string }) {
  return text.split(/(\d+(?:\.\d+)?)/).map((part, index) =>
    index % 2 ? (
      <span key={index} className="font-mono">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function DropZone({ disabled, onFiles }: DropZoneProps) {
  const t = useT();
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
        <span className="block text-lg font-medium">{t.reports.upload.drop}</span>
        <span className="block text-sm text-muted-foreground">
          <MonoNumbers
            text={t.reports.upload.limits(maxFiles, maxFileBytes / mb, maxTotalBytes / mb)}
          />
        </span>
        <span className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          {t.reports.upload.tips.map((tip) => (
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
        data-testid="upload-input"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </label>
  );
}
