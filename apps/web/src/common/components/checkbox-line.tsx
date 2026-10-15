import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CheckboxLineProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  testId?: string;
  className?: string;
};

export function CheckboxLine({
  checked,
  onChange,
  children,
  testId,
  className,
}: CheckboxLineProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        data-testid={testId}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}
