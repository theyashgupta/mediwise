import { Smartphone } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type InstallBannerProps = { onInstall: () => void; onDismiss: () => void };

export function InstallBanner({ onInstall, onDismiss }: InstallBannerProps) {
  const t = useT().dashboard.install;
  return (
    <section
      data-testid="install-banner"
      className="flex flex-col items-start gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Smartphone className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-medium">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.body}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onInstall} data-testid="install-banner-install">
          {t.action}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} data-testid="install-banner-dismiss">
          {t.dismiss}
        </Button>
      </div>
    </section>
  );
}
