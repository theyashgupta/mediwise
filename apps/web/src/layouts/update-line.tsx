import { applyUpdate, useUpdateAvailable } from "@/common/hooks/use-app-update";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

export function UpdateLine() {
  const t = useT();
  const available = useUpdateAvailable();
  if (!available) return null;
  return (
    <div
      role="status"
      data-testid="shell-update"
      className="mb-4 flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 text-sm print:hidden"
    >
      <span>{t.shell.update.available}</span>
      <Button size="sm" variant="outline" onClick={applyUpdate}>
        {t.shell.update.action}
      </Button>
    </div>
  );
}
