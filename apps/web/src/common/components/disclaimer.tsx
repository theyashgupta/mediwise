import { Info } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";

export function Disclaimer({ centered }: { centered?: boolean }) {
  const t = useT();
  if (centered) {
    return (
      <p className="text-center text-sm text-balance text-muted-foreground">
        <Info className="mr-1.5 inline size-4 align-[-0.1875rem]" aria-hidden />
        {t.common.disclaimer}
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      {t.common.disclaimer}
    </p>
  );
}
