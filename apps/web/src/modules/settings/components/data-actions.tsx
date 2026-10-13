import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataActionsProps = {
  downloading: boolean;
  error?: string;
  onDownload: () => void;
  onDelete: () => void;
};

export function DataActions({ downloading, error, onDownload, onDelete }: DataActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={onDownload} disabled={downloading}>
          <Download aria-hidden />
          {downloading ? "Preparing download" : "Download my data"}
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden />
          Delete account
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
