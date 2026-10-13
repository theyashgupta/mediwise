import { Info } from "lucide-react";

export function Disclaimer() {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      MediWise is for information, not diagnosis. It does not replace a doctor.
    </p>
  );
}
