import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileCsvButtonProps = {
  caption: string;
  downloading: boolean;
  error?: string;
  onDownload: () => void;
};

export function ProfileCsvButton({
  caption,
  downloading,
  error,
  onDownload,
}: ProfileCsvButtonProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={downloading}
          data-testid="profile-csv"
        >
          <FileSpreadsheet aria-hidden />
          {downloading ? "Preparing file" : "Download all values (CSV)"}
        </Button>
        <span className="text-sm text-muted-foreground">{caption}</span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
