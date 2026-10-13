import { Info } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";

export function Disclaimer() {
  const t = useT();
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t.common.disclaimer}
    </p>
  );
}
