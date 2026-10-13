import { FileImage, FileText } from "lucide-react";
import { fileKind } from "../config/files";

type FileTypeIconProps = {
  name: string;
  mime?: string;
};

export function FileTypeIcon({ name, mime }: FileTypeIconProps) {
  const kind = fileKind(name, mime);
  const Icon = kind === "pdf" ? FileText : FileImage;
  return (
    <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <Icon className="size-4" aria-hidden />
      <span className="font-mono text-[0.5625rem] leading-none font-medium uppercase">{kind}</span>
    </span>
  );
}
