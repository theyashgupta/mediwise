import { Download, Trash2 } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type DataActionsProps = {
  downloading: boolean;
  files: { name: string; url: string }[];
  error?: string;
  onDownload: () => void;
  onDelete: () => void;
};

export function DataActions({ downloading, files, error, onDownload, onDelete }: DataActionsProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full sm:w-fit"
        onClick={onDownload}
        disabled={downloading}
        data-testid="export-download"
      >
        <Download aria-hidden />
        {downloading ? t.settings.data.preparing : t.settings.data.download}
      </Button>
      {files.length > 0 && (
        <div className="space-y-2" data-testid="export-files">
          <p className="text-sm font-medium">{t.settings.data.files}</p>
          <ul className="space-y-1 text-sm">
            {files.map((file) => (
              <li key={file.url}>
                <a
                  href={file.url}
                  download={file.name}
                  className="break-all text-primary underline-offset-4 hover:underline"
                  data-testid="export-file"
                >
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t.settings.data.filesExpire}</p>
        </div>
      )}
      <div className="border-t pt-4">
        <Button variant="destructive" className="w-full sm:w-fit" onClick={onDelete}>
          <Trash2 aria-hidden />
          {t.settings.data.delete}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
