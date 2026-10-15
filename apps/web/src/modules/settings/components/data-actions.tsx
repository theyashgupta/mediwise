import { Download, Trash2 } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type DataActionsProps = {
  downloading: boolean;
  error?: string;
  onDownload: () => void;
  onDelete: () => void;
};

export function DataActions({ downloading, error, onDownload, onDelete }: DataActionsProps) {
  const t = useT();
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full sm:w-fit"
        onClick={onDownload}
        disabled={downloading}
      >
        <Download aria-hidden />
        {downloading ? t.settings.data.preparing : t.settings.data.download}
      </Button>
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
